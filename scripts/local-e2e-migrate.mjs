import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import {
  createLocalE2eChildEnvironment,
  localE2eDatabaseSummary,
  requireLocalE2eDatabaseUrl,
} from "./local-e2e-contract.mjs";
import { createIsolatedLocalE2eWorkspace } from "./local-e2e-api.mjs";

const databaseUrl = requireLocalE2eDatabaseUrl();
console.log(`Applying reviewed migrations to local E2E database: ${localE2eDatabaseSummary(databaseUrl)}`);

const workspaceDirectory = await createIsolatedLocalE2eWorkspace();
try {
  const result = spawnSync(
    process.execPath,
    ["x", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
    {
      cwd: workspaceDirectory,
      env: createLocalE2eChildEnvironment(databaseUrl),
      stdio: "inherit",
    }
  );

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(workspaceDirectory, { recursive: true, force: true });
}
