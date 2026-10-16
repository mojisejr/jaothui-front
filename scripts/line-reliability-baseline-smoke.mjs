import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import net from "node:net";
import http from "node:http";
import https from "node:https";
import { mock } from "bun:test";
import jwt from "jsonwebtoken";

// Deliberately RED until Slice 2. The separate baseline mode pins the exact
// known defects; it is never a declaration that the desired contract passes.
const flags = process.argv.slice(2);
assert.ok(flags.every((arg) => arg === "--expect-known-failures"), "Unsupported flag");
const baselineMode = flags.includes("--expect-known-failures");
const manifest = JSON.parse(await readFile(new URL("./line-reliability-baseline-cases.json", import.meta.url), "utf8"));
const secret = "synthetic-line-reliability-baseline-not-a-production-secret";

// Override relevant configuration BEFORE importing any application modules.
// Bun may auto-load local env files, so do not trust inherited endpoint values.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://synthetic@127.0.0.1:1/never_connect";
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.JAOTHUI_MOBILE_AUTH_SECRET = secret;
process.env.private_procedure_secret = "";
process.env.NEXT_PUBLIC_supabase_url = "http://127.0.0.1:1";
process.env.NEXT_PUBLIC_supabase_key = "synthetic-unused-key";

let forbiddenOperations = 0;
const denyIO = () => {
  forbiddenOperations += 1;
  throw new Error("Baseline safety guard: network or unexpected database access forbidden");
};
globalThis.fetch = denyIO;
net.Socket.prototype.connect = denyIO;
http.request = denyIO;
http.get = denyIO;
https.request = denyIO;
https.get = denyIO;

let scenario;
let reads = 0;
const activeAccount = {
  id: "synthetic_line_account",
  status: "ACTIVE",
  role: "USER",
  identities: [{ provider: "line", providerUserId: "synthetic_line_subject" }],
  walletLinks: [],
};
const failures = {
  capacity: () => Object.assign(new Error("Error querying the database: EMAXCONNSESSION: max clients reached in session mode - max clients are limited to pool_size: 15"), { name: "PrismaClientUnknownRequestError" }),
  unavailable: () => Object.assign(new Error("Can't reach database server at synthetic loopback target"), { code: "P1001", name: "PrismaClientInitializationError" }),
  timeout: () => Object.assign(new Error("Timed out fetching a new connection from the connection pool"), { code: "P2024", name: "PrismaClientKnownRequestError" }),
  unknown: () => new Error("Synthetic unexpected account lookup failure"),
};
const account = new Proxy({
  findUnique: async ({ where }) => {
    reads += 1;
    assert.equal(where.id, activeAccount.id, "Only synthetic account may be queried");
    if (failures[scenario.kind] && reads === (scenario.failAt ?? 1)) throw failures[scenario.kind]();
    if (scenario.kind === "absent") return null;
    return { ...activeAccount, status: scenario.kind === "inactive" ? "DELETED" : "ACTIVE" };
  },
}, { get: (target, property) => target[property] ?? denyIO });
const fakePrisma = new Proxy({ account }, { get: (target, property) => target[property] ?? denyIO });
// Replace infrastructure, not auth/guard/profile logic. No PrismaClient is
// created and no real database can be queried, even if a future path drifts.
mock.module("../server/prisma.ts", () => ({ prisma: fakePrisma }));

const auth = await import("../server/mobile/auth-session.ts");
const handlers = {
  profile: (await import("../pages/api/mobile/v2/profile.ts")).default,
  me: (await import("../pages/api/mobile/v2/me.ts")).default,
};
const validToken = auth.createMobileLineAccountSession({ accountId: activeAccount.id, lineUserId: "synthetic_line_subject" }).token;
const validPayload = jwt.decode(validToken);
const expiredToken = jwt.sign({ ...validPayload, exp: 1 }, secret, { algorithm: "HS256" });
const invalidSignature = jwt.sign(validPayload, "different-synthetic-signing-secret", { algorithm: "HS256" });
const originalConsoleError = console.error;
let capturedErrors = 0;
// Route handlers currently log the injected errors. Count them without printing
// stacks, raw tokens, config, or any inherited environment data.
console.error = () => { capturedErrors += 1; };
const results = [];
try {
  for (const testCase of manifest.cases) {
    for (const route of testCase.routes ?? Object.keys(handlers)) {
      scenario = testCase;
      reads = 0;
      process.env.JAOTHUI_MOBILE_AUTH_SECRET = testCase.kind === "config" ? "" : secret;
      const token = testCase.kind === "malformed" ? "not-a-jwt"
        : testCase.kind === "expired" ? expiredToken
          : testCase.kind === "signature" ? invalidSignature : validToken;
      const request = {
        method: "GET",
        headers: { "x-request-id": `synthetic-${route}-${testCase.id}`, ...(testCase.kind === "missing" ? {} : { authorization: `Bearer ${token}` }) },
      };
      const response = {
        statusCode: 200,
        headers: {},
        setHeader(key, value) { this.headers[key] = value; return this; },
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
      };
      await handlers[route](request, response);
      assert.equal(response.body.requestId, request.headers["x-request-id"]);
      assert.match(response.headers["Cache-Control"], /no-store/);
      assert.equal(response.body.ok, response.statusCode === 200, "Preserve released response envelope");
      if (response.statusCode !== 200) {
        assert.equal(typeof response.body.error.code, "string");
        assert.equal(typeof response.body.error.message, "string");
        assert.doesNotMatch(JSON.stringify(response.body), /EMAXCONNSESSION|pool_size|P1001|P2024|synthetic-signing|not-a-jwt/i, "Infrastructure/secrets must not leak in response");
        assert.ok(!JSON.stringify(response.body).includes(token), "Bearer token must not leak in response");
        assert.ok(!JSON.stringify(response.body).includes(secret), "Signing secret must not leak in response");
      }
      const deniedBeforeDB = ["missing", "malformed", "expired", "signature", "config"].includes(testCase.kind);
      assert.equal(reads, deniedBeforeDB ? 0 : testCase.kind === "active" && route === "profile" ? 2 : testCase.failAt ?? 1);
      if (testCase.kind === "active") {
        const identity = response.body.data.identity;
        assert.equal(identity.provider, "line");
        assert.equal(identity.accountId, activeAccount.id);
        assert.equal(identity.linkedWallet, null, "LINE-only login requires neither web priming nor wallet");
        if (route === "profile") {
          assert.equal(response.body.data.member, null);
          assert.deepEqual(response.body.data.ownedBuffalos, []);
        }
      }
      results.push({ route, case: testCase.id, desired: testCase.desired, actual: response.statusCode, baseline: testCase.baseline[route] });
    }
  }
} finally {
  console.error = originalConsoleError;
  process.env.JAOTHUI_MOBILE_AUTH_SECRET = secret;
}
assert.equal(forbiddenOperations, 0, "No network, real DB, or unexpected database method permitted");
const mismatches = results.filter((row) => row.actual !== row.desired);
console.log(JSON.stringify({ mode: baselineMode ? "KNOWN-FAILURE-REPRODUCTION (not fixed)" : "STRICT-DESIRED-CONTRACT", cases: results.length, desiredPass: results.length - mismatches.length, desiredFail: mismatches.length, forbiddenOperations, capturedHandlerErrors: capturedErrors, results }, null, 2));
if (baselineMode) {
  for (const row of results) assert.equal(row.actual, row.baseline, `${row.route}/${row.case}: exact baseline changed; investigate instead of blessing it`);
  const expectedFailures = results.filter((row) => row.baseline !== row.desired);
  assert.equal(mismatches.length, expectedFailures.length, "Known failure set must match exactly");
  assert.ok(mismatches.length > 0, "Baseline mode must not silently pass after fixes; use desired-contract mode");
  console.log(`BASELINE REPRODUCED: ${mismatches.length} exact known status defects; ${results.length - mismatches.length} positive/negative controls pass. Slice 2 fix remains required.`);
} else {
  assert.equal(mismatches.length, 0, `${mismatches.length} desired contracts fail: ${mismatches.map((row) => `${row.route}/${row.case} ${row.actual}!=${row.desired}`).join(", ")}`);
}
