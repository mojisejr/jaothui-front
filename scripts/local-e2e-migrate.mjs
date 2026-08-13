import { spawnSync } from "node:child_process";
import {
  createLocalE2eChildEnvironment,
  localE2eDatabaseSummary,
  requireLocalE2eDatabaseUrl,
} from "./local-e2e-contract.mjs";

const databaseUrl = requireLocalE2eDatabaseUrl();
console.log(`Applying reviewed migrations to local E2E database: ${localE2eDatabaseSummary(databaseUrl)}`);

const result = spawnSync(
  process.execPath,
  ["x", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
  {
    cwd: process.cwd(),
    env: createLocalE2eChildEnvironment(databaseUrl),
    stdio: "inherit",
  }
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
