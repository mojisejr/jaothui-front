import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import {
  createLocalE2eChildEnvironment,
  localE2eDatabaseSummary,
  requireLocalE2eDatabaseUrl,
} from "./local-e2e-contract.mjs";
import { createIsolatedLocalE2eWorkspace } from "./local-e2e-api.mjs";

const databaseUrl = requireLocalE2eDatabaseUrl();
const childEnvironment = createLocalE2eChildEnvironment(databaseUrl);
childEnvironment.JAOTHUI_E2E_DATABASE_URL = databaseUrl;

console.log(`Starting isolated local E2E seed worker: ${localE2eDatabaseSummary(databaseUrl)}`);
const workspaceDirectory = await createIsolatedLocalE2eWorkspace();
try {
  const result = spawnSync(process.execPath, ["scripts/local-e2e-seed-worker.mjs"], {
    cwd: workspaceDirectory,
    env: childEnvironment,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(workspaceDirectory, { recursive: true, force: true });
}
