import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { mock } from "bun:test";

const database = "jaothui_line_reliability_e2e";
const user = "jaothui_line_e2e";
const query = "pgbouncer=true&connection_limit=1&connect_timeout=5&pool_timeout=10";
const direct = `postgresql://${user}@127.0.0.1:55433/${database}`;
const pooled = `postgresql://${user}@127.0.0.1:55434/${database}?${query}`;
const mode = process.argv[2];
assert.ok(process.argv.length === 3 && ["--self-test", "--prepare", "--run"].includes(mode), "Use --self-test, --prepare or --run");
function targetGuard(env) {
  assert.ok(env.JAOTHUI_LINE_E2E_ACK === "isolated-synthetic-only", "Explicit synthetic-only acknowledgement required");
  // Exact strings reject aliases, passwords, hosts, schemas and URL overrides.
  assert.ok(env.JAOTHUI_LINE_E2E_DATABASE_URL === direct, "Pinned direct target required; no env fallback");
  assert.ok(env.JAOTHUI_LINE_E2E_POOL_URL === pooled, "Pinned transaction-pool target required");
}
const good = { JAOTHUI_LINE_E2E_ACK: "isolated-synthetic-only", JAOTHUI_LINE_E2E_DATABASE_URL: direct, JAOTHUI_LINE_E2E_POOL_URL: pooled };
if (mode === "--self-test") {
  targetGuard(good);
  for (const patch of [{ JAOTHUI_LINE_E2E_ACK: "" }, { JAOTHUI_LINE_E2E_DATABASE_URL: "" },
    { JAOTHUI_LINE_E2E_POOL_URL: pooled.replace("127.0.0.1", "production.invalid") },
    { JAOTHUI_LINE_E2E_POOL_URL: pooled.replace("55434", "6543") },
    { JAOTHUI_LINE_E2E_POOL_URL: `${pooled}&schema=public` }]) assert.throws(() => targetGuard({ ...good, ...patch }));
  console.log("Local integration guard PASS: 1 allow,5 denies; no I/O");
  process.exit(0);
}
targetGuard(process.env);
const childEnv = { PATH: "/opt/homebrew/bin:/usr/bin:/bin", LANG: "C", PGCONNECT_TIMEOUT: "3", PGPASSFILE: "/dev/null" };
function psql(sql, port = "55433", db = database) {
  const result = spawnSync("/opt/homebrew/bin/psql", ["-X", "--no-password", "-tA", "-h", "127.0.0.1", "-p", port, "-U", user, "-d", db, "-v", "ON_ERROR_STOP=1"], { env: childEnv, input: sql, encoding: "utf8", timeout: 15_000 });
  assert.ok(result.status === 0, "Pinned local SQL failed; inspect isolated local cluster (raw details withheld)");
  return result.stdout.trim();
}
assert.equal(psql("SELECT current_database() || '|' || current_user || '|' || host(inet_server_addr()) || '|' || inet_server_port();"), `${database}|${user}|127.0.0.1|55433`);
if (mode === "--prepare") {
  assert.equal(psql("SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema');"), "0", "Prepare requires empty database; never resets existing tables");
  const files = ["202607140455_add_account_identity_wallet_link", "20260812224709_add_account_soft_deletion"];
  const statements = await Promise.all(files.map((name) => readFile(new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url), "utf8")));
  psql(`BEGIN;\n${statements.join("\n")}\nCOMMIT;`);
  console.log("Prepared3 account tables from existing migrations on isolated local target only; production migrations unchanged.");
  process.exit(0);
}
const config = psql("SHOW CONFIG;", "55434", "pgbouncer");
for (const line of ["pool_mode|transaction|", "default_pool_size|2|", "max_prepared_statements|0|"]) assert.ok(config.includes(line), "Pooler topology differs from frozen benchmark");
assert.ok(psql("SHOW DATABASES;", "55434", "pgbouncer").includes(`${database}|127.0.0.1|55433|${database}|`), "Pooler backend must be pinned direct database");
assert.equal(psql("SELECT string_agg(table_name, ',' ORDER BY table_name) FROM information_schema.tables WHERE table_schema='public';"), "Account,AccountIdentity,WalletLink");

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://synthetic@127.0.0.1:1/never_connect";
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.JAOTHUI_MOBILE_AUTH_SECRET = "synthetic-isolated-line-e2e-signing-key";
process.env.private_procedure_secret = "";
const { PrismaClient } = await import("@prisma/client");
// Ten simulated warm instances, one client connection each; not one serialized
// single-client benchmark. These connect ONLY to the pinned local pooler.
const clients = Array.from({ length: 10 }, () => new PrismaClient({ datasources: { db: { url: pooled } }, log: [] }));
const db = clients[0];
mock.module("../server/prisma.ts", () => ({ prisma: db }));
const accounts = await import("../server/services/account.service.ts");
const auth = await import("../server/mobile/auth-session.ts");
const { requireActiveMobileAccountSession } = await import("../server/mobile/account-guard.ts");
const { getMobileAccountProfile } = await import("../server/mobile/account-profile.ts");
const handlers = { profile: (await import("../pages/api/mobile/v2/profile.ts")).default, me: (await import("../pages/api/mobile/v2/me.ts")).default };
function response() {
  return { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; return this; }, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } };
}
async function route(name, token, expected) {
  const res = response();
  await handlers[name]({ method: "GET", headers: { authorization: `Bearer ${token}`, "x-request-id": randomUUID() } }, res);
  assert.equal(res.statusCode, expected, `Real ${name} handler returned unexpected status`);
  if (expected === 200) assert.equal(res.body.data.identity.linkedWallet, null);
  return res.body;
}
const prefix = `line-e2e-${randomUUID()}`;
let report;
try {
  const fresh = await accounts.findOrCreateLineAccount({ providerUserId: `${prefix}-new` }, db);
  const again = await accounts.findOrCreateLineAccount({ providerUserId: `${prefix}-new` }, db);
  assert.equal(fresh.id, again.id);
  const collision = await Promise.allSettled(clients.map((client) => accounts.findOrCreateLineAccount({ providerUserId: `${prefix}-race` }, client)));
  assert.equal(collision.filter((r) => r.status === "rejected").length, 0, "Concurrent first identity creation failed");
  assert.equal(new Set(collision.map((r) => r.value.id)).size, 1, "Concurrent first login created multiple accounts");
  assert.equal(await db.accountIdentity.count({ where: { provider: "line", providerUserId: `${prefix}-race` } }), 1);
  const durations = [];
  const failureCodes = [];
  let cursor = 0;
  await Promise.all(clients.map(async (client) => {
    for (;;) {
      const index = cursor++;
      if (index >= 50) return;
      const started = performance.now();
      try {
        const account = await accounts.findOrCreateLineAccount({ providerUserId: `${prefix}-load-${index % 5}` }, client);
        const signed = auth.createMobileLineAccountSession({ accountId: account.id, lineUserId: `${prefix}-load-${index % 5}` });
        const session = auth.verifyMobileSessionToken(signed.token);
        await requireActiveMobileAccountSession(session, client);
        const profile = await getMobileAccountProfile(session, {
          getAccountProfile: (id) => accounts.getAccountProfile(id, client),
          getMemberData: async () => { throw new Error("LINE-only profile must not access wallet upstream"); },
        });
        assert.equal(profile.identity.linkedWallet, null);
        assert.equal(profile.member, null);
        durations.push(performance.now() - started);
      } catch (error) { failureCodes.push(typeof error?.code === "string" && /^P\d{4}$/.test(error.code) ? error.code : "unexpected"); }
    }
  }));
  const sorted = [...durations].sort((a, b) => a - b);
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
  report = { mode: "ISOLATED-PGBOUNCER-TRANSACTION", sequences: 50, concurrency: 10, prismaClients: 10, clientConnectionLimit: 1, backingPoolSize: 2, passed: durations.length, failures: failureCodes, p95Ms: Math.round(p95 ?? 0), maxMs: Math.round(sorted.at(-1) ?? 0) };
  console.log(JSON.stringify(report));
  assert.equal(failureCodes.length, 0, "Isolated account/profile load has failures");
  assert.ok(p95 <= 5000, "Isolated p95 exceeds frozen5s target");
  const token = auth.createMobileLineAccountSession({ accountId: fresh.id, lineUserId: `${prefix}-new` }).token;
  await route("profile", token, 200);
  await route("me", token, 200);
  const deleted = await accounts.softDeleteAccount(fresh.id, db);
  assert.equal(deleted.removedIdentityCount, 1);
  await route("profile", token, 401);
  await route("me", token, 401);
  const replacement = await accounts.findOrCreateLineAccount({ providerUserId: `${prefix}-new` }, db);
  assert.notEqual(replacement.id, fresh.id);
  assert.equal(await db.account.count({ where: { identities: { some: { providerUserId: { startsWith: prefix } } } } }), 7, "Unexpected active account cardinality");
  assert.equal(await db.walletLink.count(), 0);
  assert.equal(await db.account.count({ where: { status: "ACTIVE", identities: { none: {} } } }), 0, "Concurrent upsert must not leave orphan active accounts");
  const pools = psql("SHOW POOLS;", "55434", "pgbouncer").split("\n").find((row) => row.startsWith(`${database}|${user}|`))?.split("|");
  assert.ok(pools && pools[15] === "transaction", "Expected transaction pool topology");
  const clientConnections = Number(pools[2]) + Number(pools[3]);
  const serverConnections = [6, 7, 8, 9, 10, 11, 12].reduce((sum, index) => sum + Number(pools[index]), 0);
  assert.equal(clientConnections, 10, "Benchmark requires ten independently connected Prisma instances");
  assert.ok(serverConnections > 0 && serverConnections <= 2, "Pooler must multiplex clients onto at most two servers");
  console.log(JSON.stringify({ topologyVerified: true, clientConnections, serverConnections, transactionMode: true }));
  console.log("PASS: new/existing/concurrent unique identities,50account/profile sequences, real200/401 handlers, deletion and clean reprovision; no provider/web priming.");
} finally {
  await Promise.all(clients.map((client) => client.$disconnect()));
}
