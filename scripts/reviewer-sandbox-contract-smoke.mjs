import assert from "node:assert/strict";

process.env.JAOTHUI_MOBILE_AUTH_SECRET = "contract-signing-key";

const auth = await import("../server/mobile/auth-session.ts");
const reviewer = await import("../server/mobile/reviewer-sandbox.ts");
const accounts = await import("../server/services/account.service.ts");
const profile = await import("../server/mobile/account-profile.ts");
const guard = await import("../server/mobile/account-guard.ts");

class ReviewerClient {
  accounts = new Map();
  identities = new Map();
  next = 0;

  key(provider, providerUserId) { return `${provider}:${providerUserId}`; }
  hydrate(accountId) {
    const account = this.accounts.get(accountId);
    return {
      ...account,
      identities: [...this.identities.values()].filter((item) => item.accountId === accountId),
      walletLinks: [],
    };
  }
  accountIdentity = {
    upsert: async ({ where, create, update }) => {
      const key = this.key(where.provider_providerUserId.provider, where.provider_providerUserId.providerUserId);
      const existing = this.identities.get(key);
      if (existing) {
        Object.assign(existing, { email: update.email, displayName: update.displayName, avatarUrl: update.avatarUrl });
        Object.assign(this.accounts.get(existing.accountId), update.account.update);
        return { ...existing, account: this.hydrate(existing.accountId) };
      }
      const accountId = `reviewer_account_${++this.next}`;
      const account = { id: accountId, status: "ACTIVE", role: "USER", ...create.account.create };
      this.accounts.set(accountId, account);
      const identity = { id: `reviewer_identity_${this.next}`, accountId, provider: create.provider, providerUserId: create.providerUserId, email: create.email, displayName: create.displayName, avatarUrl: create.avatarUrl };
      this.identities.set(key, identity);
      return { ...identity, account: this.hydrate(accountId) };
    },
    deleteMany: async ({ where }) => {
      let count = 0;
      for (const [key, identity] of this.identities) {
        if (identity.accountId === where.accountId) { this.identities.delete(key); count += 1; }
      }
      return { count };
    },
  };
  account = {
    findUnique: async ({ where }) => this.accounts.get(where.id) ?? null,
    update: async ({ where, data, select }) => {
      const account = this.accounts.get(where.id);
      Object.assign(account, data);
      return select ? Object.fromEntries(Object.keys(select).map((key) => [key, account[key]])) : account;
    },
  };
  walletLink = {
    deleteMany: async () => ({ count: 0 }),
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => { throw new Error("Reviewer fixture must not write WalletLink"); },
  };
  async $transaction(operation) { return operation(this); }
}

const disabled = { enabled: false, username: "reviewer", password: "sample-password" };
const enabled = { enabled: true, username: "reviewer", password: "sample-password" };
assert.equal(reviewer.reviewerSandboxCredentialsAreValid({ username: "reviewer", password: "sample-password" }, disabled), false);
assert.equal(reviewer.reviewerSandboxCredentialsAreValid({ username: "reviewer", password: "wrong" }, enabled), false);
assert.equal(reviewer.reviewerSandboxCredentialsAreValid({ username: "reviewer", password: "sample-password" }, enabled), true);
assert.equal(reviewer.reviewerSandboxCredentialsAreValid({ username: "reviewer", password: "sample-password" }, { enabled: true, username: null, password: null }), false);

reviewer.clearReviewerSandboxRateLimitForTests();
for (let index = 0; index < 7; index += 1) assert.equal(reviewer.reviewerSandboxAllowsAttempt("valid-contract-ip", 1000), true);
for (let index = 0; index < 5; index += 1) {
  assert.equal(reviewer.reviewerSandboxAllowsAttempt("invalid-contract-ip", 1000), true);
  reviewer.registerReviewerSandboxCredentialFailure("invalid-contract-ip", 1000);
}
assert.equal(reviewer.reviewerSandboxAllowsAttempt("invalid-contract-ip", 1000), false);

const client = new ReviewerClient();
const first = await accounts.findOrCreateReviewerSandboxAccount({ providerUserId: reviewer.REVIEWER_SANDBOX_PROVIDER_USER_ID }, client);
assert.equal(first.role, accounts.REVIEWER_SANDBOX_ROLE);
assert.equal(first.identities[0].provider, "reviewer");
assert.equal(first.walletLinks.length, 0);

const token = auth.createMobileReviewerAccountSession({ accountId: first.id, providerUserId: reviewer.REVIEWER_SANDBOX_PROVIDER_USER_ID }).token;
const verified = auth.verifyMobileSessionToken(token);
assert.equal(verified.primaryProvider, "reviewer");
assert.equal(verified.linkedWallet, null);
assert.deepEqual(auth.requireMobileReviewerAccountSession({ headers: { authorization: `Bearer ${token}` } }), verified);
await guard.requireActiveMobileReviewerSandboxSession(verified, client);

client.accounts.set("ordinary-account", { id: "ordinary-account", status: "ACTIVE", role: "USER" });
const shapedToken = auth.createMobileReviewerAccountSession({ accountId: "ordinary-account", providerUserId: reviewer.REVIEWER_SANDBOX_PROVIDER_USER_ID }).token;
const shapedSession = auth.verifyMobileSessionToken(shapedToken);
await assert.rejects(
  () => guard.requireActiveMobileReviewerSandboxSession(shapedSession, client),
  (error) => error instanceof accounts.ReviewerSandboxAccountError
);

const ordinary = auth.createMobileLineAccountSession({ accountId: "ordinary", lineUserId: "line-user" }).token;
assert.throws(() => auth.requireMobileReviewerAccountSession({ headers: { authorization: `Bearer ${ordinary}` } }), /Invalid mobile session token/);

assert.deepEqual(reviewer.createReviewerWalletFixture(true), { kind: "reviewer-sandbox", label: "Demo wallet fixture", linked: true, walletAddress: null });
assert.deepEqual(reviewer.createReviewerWalletFixture(false), { kind: "reviewer-sandbox", label: "Demo wallet fixture", linked: false, walletAddress: null });

let profileLookupCount = 0;
let memberLookupCount = 0;
const sandboxProfile = await profile.getMobileAccountProfile(verified, {
  getAccountProfile: async () => { profileLookupCount += 1; return null; },
  getMemberData: async () => { memberLookupCount += 1; return null; },
});
assert.equal(sandboxProfile.identity.provider, "reviewer");
assert.equal(profileLookupCount, 0);
assert.equal(memberLookupCount, 0);

await accounts.softDeleteAccount(first.id, client, { now: () => new Date("2026-09-15T00:00:00.000Z") });
assert.equal(client.accounts.get(first.id).status, "DELETED");
const reprovisioned = await accounts.findOrCreateReviewerSandboxAccount({ providerUserId: reviewer.REVIEWER_SANDBOX_PROVIDER_USER_ID }, client);
assert.notEqual(reprovisioned.id, first.id);
assert.equal(reprovisioned.status, "ACTIVE");
assert.equal(reprovisioned.role, accounts.REVIEWER_SANDBOX_ROLE);

console.log("Reviewer sandbox contract smoke passed");
