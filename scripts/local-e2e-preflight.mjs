import { localE2eDatabaseSummary, requireLocalE2eDatabaseUrl } from "./local-e2e-contract.mjs";

const databaseUrl = requireLocalE2eDatabaseUrl();
console.log(`Local E2E preflight passed: ${localE2eDatabaseSummary(databaseUrl)}`);
