import assert from "node:assert/strict";

export const LOCAL_E2E_DATABASE = Object.freeze({
  hostname: "127.0.0.1",
  port: "55432",
  database: "jaothui_local_e2e",
  username: "jaothui_e2e",
});

export const LOCAL_E2E_FIXTURE = Object.freeze({
  label: "jaothui-account-deletion-local-e2e-v1",
  provider: "line",
  providerUserId: "local-e2e-line-subject-v1",
  walletAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  walletProvider: "bitkub-next",
});

const allowedHosts = new Set(["127.0.0.1", "::1", "localhost"]);

export function requireLocalE2eDatabaseUrl(environment = process.env) {
  const rawUrl = environment.JAOTHUI_E2E_DATABASE_URL;
  if (!rawUrl) {
    throw new Error("JAOTHUI_E2E_DATABASE_URL is required for local E2E commands");
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("JAOTHUI_E2E_DATABASE_URL must be a valid PostgreSQL URL");
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("JAOTHUI_E2E_DATABASE_URL must use the PostgreSQL protocol");
  }
  if (!allowedHosts.has(url.hostname)) {
    throw new Error("Local E2E database host must be loopback-only");
  }
  if (url.hostname !== LOCAL_E2E_DATABASE.hostname) {
    throw new Error(`Local E2E database host must be ${LOCAL_E2E_DATABASE.hostname}`);
  }
  if ((url.port || "5432") !== LOCAL_E2E_DATABASE.port) {
    throw new Error(`Local E2E database port must be ${LOCAL_E2E_DATABASE.port}`);
  }
  if (decodeURIComponent(url.username) !== LOCAL_E2E_DATABASE.username) {
    throw new Error(`Local E2E database user must be ${LOCAL_E2E_DATABASE.username}`);
  }
  if (url.password) {
    throw new Error("Local E2E database URL must not contain a password");
  }
  if (url.pathname !== `/${LOCAL_E2E_DATABASE.database}`) {
    throw new Error(`Local E2E database name must be ${LOCAL_E2E_DATABASE.database}`);
  }
  if (url.searchParams.get("schema") !== "public") {
    throw new Error("Local E2E database URL must set schema=public");
  }

  return rawUrl;
}

export function localE2eDatabaseSummary(databaseUrl) {
  const url = new URL(databaseUrl);
  return `host=${url.hostname} port=${url.port || "5432"} database=${url.pathname.slice(1)}`;
}

export function createLocalE2eChildEnvironment(databaseUrl, environment = process.env) {
  requireLocalE2eDatabaseUrl({ JAOTHUI_E2E_DATABASE_URL: databaseUrl });

  const childEnvironment = {};
  for (const key of ["HOME", "PATH", "TERM", "TMPDIR", "TMP", "TEMP", "NO_COLOR"]) {
    if (environment[key]) childEnvironment[key] = environment[key];
  }
  childEnvironment.DATABASE_URL = databaseUrl;
  childEnvironment.NODE_ENV = "test";
  return childEnvironment;
}

export function assertSyntheticFixture(snapshot) {
  assert.equal(snapshot.account.status, "ACTIVE");
  assert.equal(snapshot.account.email, null);
  assert.equal(snapshot.account.displayName, null);
  assert.equal(snapshot.identities.length, 1);
  assert.equal(snapshot.identities[0].provider, LOCAL_E2E_FIXTURE.provider);
  assert.equal(snapshot.identities[0].providerUserId, LOCAL_E2E_FIXTURE.providerUserId);
  assert.equal(snapshot.walletLinks.length, 1);
  assert.equal(snapshot.walletLinks[0].walletAddress, LOCAL_E2E_FIXTURE.walletAddress);
  assert.equal(snapshot.walletLinks[0].provider, LOCAL_E2E_FIXTURE.walletProvider);
  assert.equal(snapshot.walletLinks[0].status, "LINKED");
}
