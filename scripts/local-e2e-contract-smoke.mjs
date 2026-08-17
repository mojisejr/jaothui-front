import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LOCAL_E2E_FIXTURE,
  assertSyntheticFixture,
  createLocalE2eChildEnvironment,
  localE2eDatabaseSummary,
  requireLocalE2eDatabaseUrl,
} from "./local-e2e-contract.mjs";

const localUrl = "postgresql://jaothui_e2e@127.0.0.1:55432/jaothui_local_e2e?schema=public";
assert.equal(requireLocalE2eDatabaseUrl({ JAOTHUI_E2E_DATABASE_URL: localUrl }), localUrl);
assert.equal(
  localE2eDatabaseSummary(localUrl),
  "host=127.0.0.1 port=55432 database=jaothui_local_e2e"
);

for (const rejectedUrl of [
  "postgresql://jaothui_e2e@aws-0-ap-southeast-1.pooler.supabase.com:5432/jaothui_local_e2e?schema=public",
  "postgresql://jaothui_e2e@127.0.0.1:5432/jaothui_local_e2e?schema=public",
  "postgresql://jaothui_e2e:password@127.0.0.1:55432/jaothui_local_e2e?schema=public",
  "postgresql://someone_else@127.0.0.1:55432/jaothui_local_e2e?schema=public",
]) {
  assert.throws(() => requireLocalE2eDatabaseUrl({ JAOTHUI_E2E_DATABASE_URL: rejectedUrl }));
}

const childEnvironment = createLocalE2eChildEnvironment(localUrl, {
  PATH: "/usr/bin",
  DATABASE_URL: "postgresql://must-not-be-forwarded@example.test/remote",
  JAOTHUI_MOBILE_AUTH_SECRET: "must-not-be-forwarded",
});
assert.deepEqual(childEnvironment, {
  PATH: "/usr/bin",
  DATABASE_URL: localUrl,
  NODE_ENV: "test",
});

const fixture = {
  account: { status: "ACTIVE", email: null, displayName: null },
  identities: [{ provider: LOCAL_E2E_FIXTURE.provider, providerUserId: LOCAL_E2E_FIXTURE.providerUserId }],
  walletLinks: [
    {
      walletAddress: LOCAL_E2E_FIXTURE.walletAddress,
      provider: LOCAL_E2E_FIXTURE.walletProvider,
      status: "LINKED",
    },
  ],
};
assert.doesNotThrow(() => assertSyntheticFixture(fixture));
assert.throws(() => assertSyntheticFixture({ ...fixture, walletLinks: [] }));

const seedLauncher = readFileSync(new URL("./local-e2e-seed.mjs", import.meta.url), "utf8");
const seedWorker = readFileSync(new URL("./local-e2e-seed-worker.mjs", import.meta.url), "utf8");
const migrateLauncher = readFileSync(new URL("./local-e2e-migrate.mjs", import.meta.url), "utf8");
assert.match(seedLauncher, /createLocalE2eChildEnvironment/);
assert.match(seedLauncher, /createIsolatedLocalE2eWorkspace/);
assert.match(seedLauncher, /local-e2e-seed-worker\.mjs/);
assert.doesNotMatch(seedLauncher, /PrismaClient/);
assert.match(seedWorker, /PrismaClient/);
assert.match(seedWorker, /process\.env\.DATABASE_URL !== databaseUrl/);
assert.match(migrateLauncher, /createIsolatedLocalE2eWorkspace/);
assert.match(migrateLauncher, /migrate", "deploy/);

console.log("Local E2E contract smoke passed");
