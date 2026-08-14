import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { LOCAL_E2E_API } from "./local-e2e-api.mjs";

const runtimeDirectory = resolve("e2e/account-deletion-local/runtime");
const runtimePath = join(runtimeDirectory, "phase-2-api.json");
assert.equal(existsSync(runtimePath), true, "Local E2E API runtime record is required");

const runtime = JSON.parse(readFileSync(runtimePath, "utf8"));
assert.equal(runtime.label, "jaothui-account-deletion-local-e2e-v1");
assert.equal(runtime.host, LOCAL_E2E_API.host);
assert.equal(runtime.port, Number(LOCAL_E2E_API.port));

const response = await fetch(`http://127.0.0.1:${LOCAL_E2E_API.port}/api/mobile/v2/me`);
assert.equal(response.status, 401, "No-session mobile v2 proof must be unauthorized");
const body = await response.json();
assert.equal(body.ok, false);
assert.equal(body.error?.code, "UNAUTHORIZED");

writeFileSync(
  join(runtimeDirectory, "phase-2-api-proof.json"),
  `${JSON.stringify({ label: runtime.label, pid: runtime.pid, responseStatus: response.status, responseCode: body.error.code, checkedAt: new Date().toISOString() })}\n`,
  { mode: 0o600 }
);
console.log(`Local E2E API no-session proof passed: status=${response.status} code=${body.error.code}`);
