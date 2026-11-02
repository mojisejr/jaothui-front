import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  LOCAL_E2E_API,
  assertNoEnvironmentFiles,
  createIsolatedLocalE2eWorkspace,
  createLocalE2eApiEnvironment,
  isExcludedLocalE2eWorkspaceEntry,
  redactLocalE2eRuntimeText,
  requireLocalE2eApiBinding,
} from "./local-e2e-api.mjs";

const databaseUrl = "postgresql://jaothui_e2e@127.0.0.1:55432/jaothui_local_e2e?schema=public";
assert.deepEqual(requireLocalE2eApiBinding({}), LOCAL_E2E_API);
assert.throws(() => requireLocalE2eApiBinding({ JAOTHUI_E2E_API_HOST: "127.0.0.1" }));
assert.throws(() => requireLocalE2eApiBinding({ JAOTHUI_E2E_API_PORT: "3000" }));

const environment = createLocalE2eApiEnvironment(databaseUrl, "x".repeat(32), {
  PATH: "/usr/bin",
  DATABASE_URL: "postgresql://must-not-be-forwarded@example.test/remote",
  JAOTHUI_MOBILE_AUTH_SECRET: "must-not-be-forwarded",
});
assert.deepEqual(environment, {
  PATH: "/usr/bin",
  DATABASE_URL: databaseUrl,
  NODE_ENV: "development",
  NEXT_TELEMETRY_DISABLED: "1",
  JAOTHUI_MOBILE_AUTH_SECRET: "x".repeat(32),
});

for (const excluded of [".env", ".env.local", ".env.production", ".next", ".git", "node_modules"]) {
  assert.equal(isExcludedLocalE2eWorkspaceEntry(excluded), true);
}
assert.equal(isExcludedLocalE2eWorkspaceEntry("pages"), false);
assert.equal(redactLocalE2eRuntimeText("http://127.0.0.1:3100 postgresql://user@127.0.0.1/db"), "[redacted-local-url] [redacted-database-url]");

const fixtureRoot = await mkdtemp(join(tmpdir(), "jaothui-local-e2e-api-contract-"));
const fixtureWorkspace = join(fixtureRoot, "workspace");
mkdirSync(join(fixtureRoot, "node_modules"));
await writeFile(join(fixtureRoot, ".env"), "REMOTE=must-not-copy");
await writeFile(join(fixtureRoot, ".env.local"), "REMOTE=must-not-copy");
await writeFile(join(fixtureRoot, "package.json"), "{}\n");

try {
  const isolated = await createIsolatedLocalE2eWorkspace(fixtureRoot);
  assert.equal(existsSync(join(isolated, ".env")), false);
  assert.equal(existsSync(join(isolated, ".env.local")), false);
  assertNoEnvironmentFiles(isolated);
  rmSync(isolated, { recursive: true, force: true });
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log("Local E2E API launcher contract smoke passed");
