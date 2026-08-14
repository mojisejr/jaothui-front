import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { Transform } from "node:stream";
import { fileURLToPath } from "node:url";

import {
  createLocalE2eChildEnvironment,
  localE2eDatabaseSummary,
  requireLocalE2eDatabaseUrl,
} from "./local-e2e-contract.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
export const LOCAL_E2E_API = Object.freeze({ host: "0.0.0.0", port: "3100" });
const excludedWorkspaceEntries = new Set([".git", ".next", "node_modules"]);

export function requireLocalE2eApiBinding(environment = process.env) {
  const host = environment.JAOTHUI_E2E_API_HOST || LOCAL_E2E_API.host;
  const port = environment.JAOTHUI_E2E_API_PORT || LOCAL_E2E_API.port;
  assert.equal(host, LOCAL_E2E_API.host, "Local E2E API host must be LAN-safe 0.0.0.0");
  assert.equal(port, LOCAL_E2E_API.port, "Local E2E API port must be 3100");
  return { host, port };
}

export function createLocalE2eApiEnvironment(databaseUrl, sessionSecret, environment = process.env) {
  requireLocalE2eDatabaseUrl({ JAOTHUI_E2E_DATABASE_URL: databaseUrl });
  assert.equal(typeof sessionSecret, "string", "Local E2E session secret must be a string");
  assert.ok(sessionSecret.length >= 32, "Local E2E session secret must be ephemeral and strong");

  return {
    ...createLocalE2eChildEnvironment(databaseUrl, environment),
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    JAOTHUI_MOBILE_AUTH_SECRET: sessionSecret,
  };
}

export function isExcludedLocalE2eWorkspaceEntry(entryName) {
  return entryName.startsWith(".env") || excludedWorkspaceEntries.has(entryName);
}

export function assertNoEnvironmentFiles(workspaceDirectory) {
  for (const entryName of [".env", ".env.local", ".env.development", ".env.development.local"]) {
    assert.equal(existsSync(join(workspaceDirectory, entryName)), false, "Isolated API workspace must not contain .env files");
  }
}

export function redactLocalE2eRuntimeText(value) {
  return String(value)
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[redacted-database-url]")
    .replace(/https?:\/\/[^\s"']+/gi, "[redacted-local-url]");
}

function copyRepositoryWithoutEnvironmentFiles(repositoryRoot, workspaceDirectory) {
  const result = spawnSync(
    "rsync",
    ["-a", "--exclude=.env*", "--exclude=.git", "--exclude=.next", "--exclude=node_modules", `${repositoryRoot}/`, `${workspaceDirectory}/`],
    { stdio: "pipe" }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error("Unable to create isolated local E2E API workspace");
  }
}

export async function createIsolatedLocalE2eWorkspace(repositoryRoot = resolve(scriptDirectory, "..")) {
  const workspaceDirectory = await mkdtemp(join(tmpdir(), "jaothui-account-deletion-e2e-api-"));
  try {
    copyRepositoryWithoutEnvironmentFiles(repositoryRoot, workspaceDirectory);
    assertNoEnvironmentFiles(workspaceDirectory);

    const originalNodeModules = join(repositoryRoot, "node_modules");
    if (!lstatSync(originalNodeModules).isDirectory()) {
      throw new Error("Local E2E API requires the reviewed node_modules directory");
    }
    symlinkSync(originalNodeModules, join(workspaceDirectory, "node_modules"));
    return workspaceDirectory;
  } catch (error) {
    rmSync(workspaceDirectory, { recursive: true, force: true });
    throw error;
  }
}

function createRedactingLogStream(logPath) {
  const log = createWriteStream(logPath, { flags: "a" });
  const redactor = new Transform({
    transform(chunk, _encoding, callback) {
      callback(null, redactLocalE2eRuntimeText(chunk));
    },
  });
  redactor.pipe(log);
  return redactor;
}

async function main() {
  const databaseUrl = requireLocalE2eDatabaseUrl();
  const { host, port } = requireLocalE2eApiBinding();
  const repositoryRoot = resolve(scriptDirectory, "..");
  const runtimeDirectory = join(repositoryRoot, "e2e", "account-deletion-local", "runtime");
  mkdirSync(runtimeDirectory, { recursive: true });

  const workspaceDirectory = await createIsolatedLocalE2eWorkspace(repositoryRoot);
  const environment = createLocalE2eApiEnvironment(databaseUrl, randomBytes(32).toString("base64url"));
  const logPath = join(runtimeDirectory, "phase-2-api.log");
  const output = createRedactingLogStream(logPath);
  const child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "--hostname", host, "--port", port],
    { cwd: workspaceDirectory, env: environment, stdio: ["ignore", "pipe", "pipe"] }
  );

  child.stdout.pipe(output, { end: false });
  child.stderr.pipe(output, { end: false });
  const runtimePath = join(runtimeDirectory, "phase-2-api.json");
  writeFileSync(
    runtimePath,
    `${JSON.stringify({ label: "jaothui-account-deletion-local-e2e-v1", host, port: Number(port), pid: child.pid, database: localE2eDatabaseSummary(databaseUrl), startedAt: new Date().toISOString() })}\n`,
    { mode: 0o600 }
  );

  const stop = (signal) => {
    if (!child.killed) child.kill(signal);
    rmSync(workspaceDirectory, { recursive: true, force: true });
    process.exit(signal === "SIGINT" ? 130 : 0);
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  child.on("exit", (code) => {
    output.end();
    rmSync(workspaceDirectory, { recursive: true, force: true });
    process.exitCode = code ?? 1;
  });

  console.log(`Local E2E API launcher started: pid=${child.pid} host=${host} port=${port} database=${localE2eDatabaseSummary(databaseUrl)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
