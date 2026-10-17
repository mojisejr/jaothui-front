import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import net from "node:net";
import http from "node:http";
import https from "node:https";
import { mock } from "bun:test";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://synthetic@127.0.0.1:1/never_connect";
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.JAOTHUI_MOBILE_AUTH_SECRET = "synthetic-auth-failure-test-secret";
process.env.private_procedure_secret = "";
process.env.NEXT_PUBLIC_supabase_url = "http://127.0.0.1:1";
process.env.NEXT_PUBLIC_supabase_key = "synthetic-unused-key";
process.env.JAOTHUI_REVIEWER_SANDBOX_ENABLED = "true";
process.env.JAOTHUI_REVIEWER_SANDBOX_USERNAME = "synthetic-reviewer";
process.env.JAOTHUI_REVIEWER_SANDBOX_PASSWORD = "synthetic-password";
process.env.JAOTHUI_MOBILE_APPLE_CLIENT_ID = "synthetic-apple-audience";

let forbiddenIO = 0;
const denyIO = () => { forbiddenIO += 1; throw new Error("Unexpected network/database operation"); };
globalThis.fetch = denyIO;
net.Socket.prototype.connect = denyIO;
http.request = http.get = https.request = https.get = denyIO;
let injectedError;
let memberError;
const account = { id: "synthetic-account", status: "ACTIVE", role: "USER", identities: [], walletLinks: [] };
const lookup = async () => { if (injectedError) throw injectedError; return account; };
const fakePrisma = new Proxy({
  account: { findUnique: lookup },
  accountIdentity: { upsert: async () => ({ account: await lookup() }) },
  walletLink: { findFirst: async () => null },
  user: { findUnique: async () => { if (memberError) throw memberError; return lookup(); } },
}, { get: (target, property) => target[property] ?? denyIO });
mock.module("../server/prisma.ts", () => ({ prisma: fakePrisma }));
const errors = await import("../server/auth/errors.ts");
const diagnostics = await import("../server/auth/diagnostics.ts");
const ids = await import("../server/auth/request-id.ts");
const auth = await import("../server/mobile/auth-session.ts");
const line = await import("../server/mobile/line-auth.ts");
const bitkub = await import("../server/mobile/bitkub-next-auth.ts");
const accounts = await import("../server/services/account.service.ts");
const apple = await import("../server/mobile/apple-auth.ts");
const wallet = await import("../server/mobile/bitkub-next-link.ts");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sensitive = "DO_NOT_LOG_token_session_account_signature_eySynthetic.url?code=secret";
const transient = () => Object.assign(new Error(`EMAXCONNSESSION: max clients reached in session mode pool_size: 15 ${sensitive}`), { name: "PrismaClientUnknownRequestError" });
const fixtures = [
  [new errors.InvalidAuthError(), 401],
  [new accounts.AccountNotActiveError(), 401],
  [new accounts.ReviewerSandboxAccountError(), 401],
  [new errors.AuthConfigurationError(sensitive), 500],
  [new errors.AuthServiceUnavailableError(sensitive), 503],
  [transient(), 503],
  ...["P1001", "P1002", "P1008", "P1017", "P2024", "EMAXCONNSESSION", "53300", "57P03"].map((code) => [Object.assign(new Error(sensitive), { code }), 503]),
  [new Error(sensitive), 500],
  [{ message: sensitive, code: "P2002" }, 500],
  [{ message: "session jwt token expired signature account" }, 500],
  [new Error("database auth signing token configuration failure"), 500],
  [{ cause: { code: "P1001" } }, 503],
  [new Prisma.PrismaClientInitializationError(sensitive, "5.14.0", "P1001"), 503],
  [new Prisma.PrismaClientInitializationError(sensitive, "5.14.0", "P1011"), 500],
  [new Prisma.PrismaClientInitializationError(sensitive, "5.14.0", "P1000"), 500],
  [{ cause: new Prisma.PrismaClientInitializationError(sensitive, "5.14.0", "P1001") }, 503],
];
for (const [error, status] of fixtures) assert.equal(diagnostics.classifyAuthFailure(error).status, status);
const cyclic = {}; cyclic.cause = cyclic;
assert.equal(diagnostics.classifyAuthFailure(cyclic).status, 500);
assert.equal(apple.toMobileAppleAuthErrorCode(new Error("Apple public key config token error")), "APPLE_AUTH_FAILED");
assert.equal(wallet.toMobileWalletLinkErrorCode(new Error("account session database failure")), "MOBILE_WALLET_LINK_FAILED");

const logs = [];
const original = { info: console.info, warn: console.warn, error: console.error, log: console.log };
for (const level of Object.keys(original)) console[level] = (...args) => logs.push(args);
let handlerChecks = 0;
try {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const appleClaims = { sub: "synthetic-apple-subject", aud: "synthetic-apple-audience", iss: "https://appleid.apple.com", exp: Math.floor(Date.now() / 1000) + 60 };
  const appleToken = jwt.sign(appleClaims, privateKey, { algorithm: "RS256", keyid: "synthetic-kid" });
  globalThis.fetch = async () => { throw new Error(sensitive); };
  await assert.rejects(() => apple.verifyAppleIdentityToken(appleToken), (error) => diagnostics.classifyAuthFailure(error).status === 503);
  globalThis.fetch = async (url) => {
    assert.equal(url, "https://appleid.apple.com/auth/keys");
    return new Response(JSON.stringify({ keys: [{ ...publicKey.export({ format: "jwk" }), kid: "synthetic-kid", alg: "RS256", use: "sig" }] }));
  };
  assert.equal((await apple.verifyAppleIdentityToken(appleToken)).providerUserId, appleClaims.sub);
  for (const claims of [{ ...appleClaims, aud: "wrong-audience" }, { ...appleClaims, iss: "https://invalid.test" }, { ...appleClaims, exp: 1 }]) {
    await assert.rejects(() => apple.verifyAppleIdentityToken(jwt.sign(claims, privateKey, { algorithm: "RS256", keyid: "synthetic-kid" })), (error) => diagnostics.classifyAuthFailure(error).status === 401);
  }
  globalThis.fetch = denyIO;
  for (const value of [sensitive, "bad\nheader", "x".repeat(500), [randomUUID()], undefined]) {
    const req = { headers: { "x-request-id": value } };
    const id = ids.getAuthRequestId(req);
    assert.match(id, UUID);
    assert.equal(ids.getAuthRequestId(req), id, "Stable correlation within one request");
    diagnostics.logAuthStage({ requestId: value, flow: "mobile_line", stage: "account_upsert", outcome: "failed", error: transient() });
  }
  const acceptedId = randomUUID();
  assert.equal(ids.safeAuthRequestId(acceptedId), acceptedId);
  diagnostics.logAuthStage({ requestId: sensitive, flow: sensitive, stage: sensitive, outcome: "failed", error: transient() });

  const lineToken = auth.createMobileLineAccountSession({ accountId: account.id, lineUserId: "synthetic-line" }).token;
  const reviewerToken = auth.createMobileReviewerAccountSession({ accountId: account.id, providerUserId: "synthetic-reviewer" }).token;
  const legacyToken = auth.createMobileSession({ walletAddress: "0xsynthetic" }).token;
  const dbRoutes = [
    ["../pages/api/mobile/v2/profile.ts", "GET", lineToken, {}],
    ["../pages/api/mobile/v2/me.ts", "GET", lineToken, {}],
    ["../pages/api/mobile/v2/account.ts", "DELETE", lineToken, {}],
    ["../pages/api/mobile/v2/auth/apple/session.ts", "POST", lineToken, { identityToken: sensitive }],
    ["../pages/api/mobile/v2/auth/bitkub-next/link-intent.ts", "POST", lineToken, {}],
    ["../pages/api/mobile/v2/auth/bitkub-next/link/session.ts", "POST", lineToken, { handoff: sensitive }],
    ["../pages/api/mobile/v2/reviewer/wallet-fixture.ts", "POST", reviewerToken, { linked: true }],
    ["../pages/api/mobile/v2/auth/reviewer-session.ts", "POST", null, { username: "synthetic-reviewer", password: "synthetic-password" }],
    ["../pages/api/mobile/v1/profile.ts", "GET", legacyToken, {}],
  ];
  const run = async (path, method, token, body) => {
    const { default: handler } = await import(path);
    const req = { method, headers: { "x-request-id": sensitive, ...(token ? { authorization: `Bearer ${token}` } : {}) }, body, socket: { remoteAddress: "127.0.0.1" } };
    const res = { statusCode: 200, setHeader() {}, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
    await handler(req, res);
    assert.match(res.body.requestId, UUID);
    assert.ok(!JSON.stringify(res.body).includes(sensitive));
    handlerChecks += 1;
    return res;
  };
  for (const args of dbRoutes) {
    injectedError = transient();
    const unavailable = await run(...args);
    assert.equal(unavailable.statusCode, 503, args[0]);
    assert.equal(unavailable.body.error.code, "SERVICE_UNAVAILABLE");
    injectedError = new Error(sensitive);
    assert.equal((await run(...args)).statusCode, 500, args[0]);
  }
  injectedError = undefined;
  memberError = transient();
  account.walletLinks = [{ walletAddress: "0xsynthetic", provider: "bitkub-next", email: null }];
  assert.equal((await run("../pages/api/mobile/v2/profile.ts", "GET", lineToken, {})).statusCode, 503, "Linked-wallet outage is not a successful empty profile");
  account.walletLinks = [];
  memberError = undefined;
  assert.equal((await run("../pages/api/mobile/v2/auth/apple/session.ts", "POST", null, { identityToken: "malformed" })).statusCode, 401);
  const handoff = line.createMobileLineOAuthHandoff({ accountId: account.id, lineUserId: "synthetic-line", email: null, displayName: null, avatarUrl: null, linkedWallet: null });
  const legacyHandoff = bitkub.createMobileOAuthHandoff({ walletAddress: "0xsynthetic" });
  for (const [path, valid] of [["../pages/api/mobile/v2/auth/line/session.ts", handoff], ["../pages/api/mobile/v1/auth/bitkub-next/session.ts", legacyHandoff]]) {
    assert.equal((await run(path, "POST", null, { handoff: valid })).statusCode, 200);
    assert.equal((await run(path, "POST", null, { handoff: "malformed" })).statusCode, 401);
    const saved = process.env.JAOTHUI_MOBILE_AUTH_SECRET;
    process.env.JAOTHUI_MOBILE_AUTH_SECRET = "";
    assert.equal((await run(path, "POST", null, { handoff: valid })).statusCode, 500);
    process.env.JAOTHUI_MOBILE_AUTH_SECRET = saved;
  }

  const config = { channelId: "synthetic", channelSecret: "synthetic", callbackUrl: "https://example.test/callback", scope: "openid profile" };
  const state = line.createMobileLineOAuthState("jaothui://oauth/callback");
  const verifiedState = line.verifyMobileLineOAuthState(state);
  let providerCalls = 0;
  const fetcher = async (url) => {
    providerCalls += 1;
    return new Response(JSON.stringify(url.endsWith("/token") ? { access_token: sensitive, id_token: sensitive } : { sub: "synthetic-subject", nonce: verifiedState.nonce, name: sensitive, picture: sensitive, email: sensitive }), { status: 200 });
  };
  injectedError = transient();
  await assert.rejects(() => line.completeMobileLineCallback({ code: sensitive, state, config, fetcher, requestId: sensitive }), (error) => diagnostics.classifyAuthFailure(error).status === 503);
  assert.equal(providerCalls, 2, "No retry/replay of a consumed OAuth authorization code");
  injectedError = undefined;
  const completed = await line.completeMobileLineCallback({ code: sensitive, state, config, fetcher, requestId: randomUUID() });
  assert.match(completed.deepLink, /^jaothui:\/\/oauth\/callback\?/);
  assert.equal(providerCalls, 4);
  await assert.rejects(() => line.completeMobileLineCallback({ code: sensitive, state, config, fetcher: async () => new Response("{}", { status: 503 }) }), (error) => diagnostics.classifyAuthFailure(error).status === 503);
  await assert.rejects(() => line.completeMobileLineCallback({ code: sensitive, state, config, fetcher: async () => { throw new Error(sensitive); } }), (error) => diagnostics.classifyAuthFailure(error).status === 503);
  await assert.rejects(() => line.completeMobileLineCallback({ code: sensitive, state, config, fetcher: async () => new Response(JSON.stringify({ error: "invalid_client" }), { status: 401 }) }), (error) => diagnostics.classifyAuthFailure(error).status === 500);
  const serializedLogs = JSON.stringify(logs);
  assert.ok(!serializedLogs.includes(sensitive), "Safe logs exclude raw errors, tokens, code, profile, URLs and attacker IDs");
  assert.ok(!serializedLogs.includes(process.env.JAOTHUI_MOBILE_AUTH_SECRET));
  assert.ok(logs.some(([, entry]) => entry?.stage === "account_upsert" && entry?.outcome === "failed" && entry?.category === "database_unavailable"));
  assert.equal(forbiddenIO, 0);
} finally {
  Object.assign(console, original);
}
console.log(JSON.stringify({ result: "PASS", classifierCases: fixtures.length + 1, handlerChecks, appleSignatureChecks: 5, forbiddenIO, capturedSafeLogEntries: logs.length, providerTruth: "simulated only", databaseTruth: "in-memory only" }));
