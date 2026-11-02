import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

import jwt from "jsonwebtoken";
import {
  createIsolatedLocalE2eWorkspace,
  createLocalE2eApiEnvironment,
  LOCAL_E2E_API,
  requireLocalE2eApiBinding,
} from "./local-e2e-api.mjs";
import { requireLocalE2eDatabaseUrl } from "./local-e2e-contract.mjs";

const databaseUrl = requireLocalE2eDatabaseUrl();
const { host, port } = requireLocalE2eApiBinding();
const origin = `http://127.0.0.1:${port}`;
const sessionSecret = randomBytes(32).toString("base64url");
const reviewerUsername = "reviewer-e2e";
const reviewerPassword = randomBytes(24).toString("base64url");
const repositoryRoot = resolve(".");
const workspaceDirectory = await createIsolatedLocalE2eWorkspace(repositoryRoot);
let child = null;
let serverOutput = "";
let prisma = null;
let foreignAccountId = null;
const createdReviewerAccountIds = new Set();

function environment(enabled) {
  return {
    ...createLocalE2eApiEnvironment(databaseUrl, sessionSecret),
    JAOTHUI_REVIEWER_SANDBOX_ENABLED: enabled ? "true" : "false",
    JAOTHUI_REVIEWER_SANDBOX_USERNAME: reviewerUsername,
    JAOTHUI_REVIEWER_SANDBOX_PASSWORD: reviewerPassword,
  };
}

async function stopServer() {
  if (!child) return;
  const process = child;
  child = null;
  if (!process.killed) process.kill("SIGTERM");
  await new Promise((resolveStop) => {
    const timer = setTimeout(resolveStop, 5_000);
    process.once("exit", () => { clearTimeout(timer); resolveStop(); });
  });
}

async function startServer(enabled) {
  await stopServer();
  child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "--hostname", host, "--port", port],
    { cwd: workspaceDirectory, env: environment(enabled), stdio: ["ignore", "pipe", "pipe"] }
  );
  child.stdout.on("data", (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-4000); });
  child.stderr.on("data", (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-4000); });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${origin}/api/mobile/v2/auth/reviewer-availability`);
      const body = await response.json().catch(() => null);
      if (response.ok && body?.ok === true && typeof body.data?.available === "boolean") return;
    } catch {}
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error("Local reviewer API did not become ready");
}

async function request(path, options = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON from local reviewer API: ${path} status=${response.status}\n${serverOutput}`);
  }
  return { response, body };
}

function reviewerTokenFor(accountId) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      typ: "jaothui-mobile-session",
      sessionVersion: 2,
      accountId,
      primaryProvider: "reviewer",
      providerUserId: "jaothui-mobile-reviewer-v1",
      email: null,
      displayName: "JAOTHUI Reviewer Sandbox",
      avatarUrl: null,
      linkedWallet: null,
      exp: now + 3600,
    },
    sessionSecret,
    { algorithm: "HS256", audience: "jaothui-mobile", issuer: "jaothui" }
  );
}

try {
  await startServer(false);
  let result = await request("/api/mobile/v2/auth/reviewer-availability", { method: "GET" });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.available, false);
  result = await request("/api/mobile/v2/auth/reviewer-session", {
    method: "POST", body: JSON.stringify({ username: reviewerUsername, password: reviewerPassword }),
  });
  assert.equal(result.response.status, 401);

  await startServer(true);
  result = await request("/api/mobile/v2/auth/reviewer-availability", { method: "GET" });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.available, true);
  result = await request("/api/mobile/v2/auth/reviewer-session", {
    method: "POST", body: JSON.stringify({ username: reviewerUsername, password: "invalid" }),
  });
  assert.equal(result.response.status, 401);

  result = await request("/api/mobile/v2/auth/reviewer-session", {
    method: "POST", body: JSON.stringify({ username: reviewerUsername, password: reviewerPassword }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.identity.provider, "reviewer");
  const firstToken = result.body.data.sessionToken;
  const firstAccountId = result.body.data.identity.accountId;
  createdReviewerAccountIds.add(firstAccountId);

  const { PrismaClient } = await import("@prisma/client");
  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const foreignAccount = await prisma.account.create({ data: { role: "USER", status: "ACTIVE" } });
  foreignAccountId = foreignAccount.id;
  result = await request("/api/mobile/v2/reviewer/wallet-fixture", {
    method: "POST",
    headers: { authorization: `Bearer ${reviewerTokenFor(foreignAccountId)}` },
    body: JSON.stringify({ linked: true }),
  });
  assert.equal(result.response.status, 401);

  result = await request("/api/mobile/v2/reviewer/wallet-fixture", {
    method: "POST", headers: { authorization: `Bearer ${firstToken}` }, body: JSON.stringify({ linked: true }),
  });
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body.data, { kind: "reviewer-sandbox", label: "Demo wallet fixture", linked: true, walletAddress: null });

  result = await request("/api/mobile/v2/account", {
    method: "DELETE", headers: { authorization: `Bearer ${firstToken}` }, body: JSON.stringify({}),
  });
  assert.equal(result.response.status, 200);
  const deletedAccount = await prisma.account.findUnique({ where: { id: firstAccountId } });
  assert.equal(deletedAccount?.status, "DELETED");

  // A stateless JWT issued before deletion must not retain account access.
  result = await request("/api/mobile/v2/me", {
    method: "GET", headers: { authorization: `Bearer ${firstToken}` },
  });
  assert.equal(result.response.status, 401);

  result = await request("/api/mobile/v2/auth/reviewer-session", {
    method: "POST", body: JSON.stringify({ username: reviewerUsername, password: reviewerPassword }),
  });
  assert.equal(result.response.status, 200);
  const freshAccountId = result.body.data.identity.accountId;
  assert.notEqual(freshAccountId, firstAccountId);
  createdReviewerAccountIds.add(freshAccountId);
  const freshAccount = await prisma.account.findUnique({ where: { id: freshAccountId } });
  assert.equal(freshAccount?.status, "ACTIVE");
  assert.equal(freshAccount?.role, "REVIEWER_SANDBOX");
  console.log("Reviewer sandbox local E2E passed");
} finally {
  await stopServer();
  if (prisma) {
    for (const accountId of createdReviewerAccountIds) {
      await prisma.accountIdentity.deleteMany({ where: { accountId } });
      await prisma.walletLink.deleteMany({ where: { accountId } });
      await prisma.account.delete({ where: { id: accountId } }).catch(() => undefined);
    }
    if (foreignAccountId) await prisma.account.delete({ where: { id: foreignAccountId } }).catch(() => undefined);
    await prisma.$disconnect();
  }
  rmSync(workspaceDirectory, { recursive: true, force: true });
}
