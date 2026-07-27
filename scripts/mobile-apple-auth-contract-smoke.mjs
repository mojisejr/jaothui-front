import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const appleAuth = await import("../server/mobile/apple-auth.ts");
const accountService = await import("../server/services/account.service.ts");

class InMemoryAccountClient {
  accounts = new Map();
  identities = new Map();
  walletLinks = new Map();
  accountSeq = 0;
  identitySeq = 0;

  accountIdentity = {
    upsert: async ({ where, create, update }) => {
      const key = this.identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId
      );
      const existing = this.identities.get(key);
      if (existing) {
        existing.email = update.email;
        existing.displayName = update.displayName;
        existing.avatarUrl = update.avatarUrl;
        const account = this.accounts.get(existing.accountId);
        account.email = update.account.update.email;
        account.displayName = update.account.update.displayName;
        account.avatarUrl = update.account.update.avatarUrl;
        return { ...existing, account: this.hydrateAccount(existing.accountId) };
      }

      const accountId = `account_${++this.accountSeq}`;
      this.accounts.set(accountId, {
        id: accountId,
        email: create.account.create.email,
        displayName: create.account.create.displayName,
        avatarUrl: create.account.create.avatarUrl,
        role: "USER",
        status: "ACTIVE",
      });
      const identity = {
        id: `identity_${++this.identitySeq}`,
        accountId,
        provider: create.provider,
        providerUserId: create.providerUserId,
        email: create.email,
        displayName: create.displayName,
        avatarUrl: create.avatarUrl,
      };
      this.identities.set(key, identity);
      return { ...identity, account: this.hydrateAccount(accountId) };
    },
    findUnique: async ({ where, include }) => {
      const key = this.identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId
      );
      const identity = this.identities.get(key) ?? null;
      if (!identity) return null;
      return {
        ...identity,
        ...(include?.account ? { account: this.hydrateAccount(identity.accountId) } : {}),
      };
    },
    create: async ({ data, include }) => {
      const key = this.identityKey(data.provider, data.providerUserId);
      const identity = {
        id: `identity_${++this.identitySeq}`,
        accountId: data.accountId,
        provider: data.provider,
        providerUserId: data.providerUserId,
        email: data.email,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
      };
      this.identities.set(key, identity);
      return {
        ...identity,
        ...(include?.account ? { account: this.hydrateAccount(identity.accountId) } : {}),
      };
    },
  };

  account = {
    findUnique: async ({ where }) => {
      return this.accounts.has(where.id) ? this.hydrateAccount(where.id) : null;
    },
  };

  walletLink = {
    findFirst: async ({ where }) =>
      [...this.walletLinks.values()].find(
        (link) => link.accountId === where.accountId && link.status === where.status
      ) ?? null,
    findUnique: async ({ where }) => this.walletLinks.get(where.walletAddress) ?? null,
    create: async ({ data }) => {
      const link = {
        id: `wallet_link_${this.walletLinks.size + 1}`,
        ...data,
        linkedAt: new Date(),
      };
      this.walletLinks.set(data.walletAddress, link);
      return link;
    },
  };

  identityKey(provider, providerUserId) {
    return `${provider}:${providerUserId}`;
  }

  hydrateAccount(accountId) {
    const account = this.accounts.get(accountId);
    return {
      ...account,
      identities: [...this.identities.values()].filter(
        (identity) => identity.accountId === accountId
      ),
      walletLinks: [...this.walletLinks.values()].filter(
        (link) => link.accountId === accountId && link.status === "LINKED"
      ),
    };
  }
}

const client = new InMemoryAccountClient();
const verifier = async () => ({
  providerUserId: "apple-sub-1",
  email: "relay@privaterelay.appleid.com",
  emailVerified: true,
});

const appleIdentity = await appleAuth.createAppleAccountSessionIdentity({
  identityToken: "mock-token",
  displayName: "Apple Holder",
  client,
  verifier,
});

assert.equal(appleIdentity.account.id, "account_1");
assert.equal(appleIdentity.providerUserId, "apple-sub-1");
assert.equal(appleIdentity.email, "relay@privaterelay.appleid.com");
assert.equal(appleIdentity.linkedWallet, null);

const lineAccount = await accountService.findOrCreateLineAccount(
  {
    providerUserId: "line-user-1",
    email: "line@example.test",
  },
  client
);
await accountService.linkWalletToAccount(lineAccount.id, "0xlinked", {}, client);

const attachedApple = await appleAuth.createAppleAccountSessionIdentity({
  identityToken: "mock-token-2",
  attachToAccountId: lineAccount.id,
  displayName: "Linked Apple",
  client,
  verifier: async () => ({
    providerUserId: "apple-sub-linked",
    email: null,
    emailVerified: null,
  }),
});

assert.equal(attachedApple.account.id, lineAccount.id);
assert.equal(attachedApple.providerUserId, "apple-sub-linked");
assert.equal(attachedApple.linkedWallet.walletAddress, "0xlinked");

await assert.rejects(
  () =>
    appleAuth.createAppleAccountSessionIdentity({
      identityToken: "mock-token-3",
      attachToAccountId: lineAccount.id,
      client,
      verifier,
    }),
  (error) =>
    error instanceof accountService.AccountIdentityConflictError &&
    error.code === "ACCOUNT_IDENTITY_ALREADY_LINKED"
);

const root = path.resolve(import.meta.dirname, "..");
const appleAuthSource = readFileSync(path.join(root, "server/mobile/apple-auth.ts"), "utf8");
assert.ok(appleAuthSource.includes("https://appleid.apple.com/auth/keys"));
assert.ok(appleAuthSource.includes("jwt.verify"));
assert.ok(appleAuthSource.includes("payload.sub"));
assert.ok(!appleAuthSource.includes("auto-merge"));

console.log("Mobile Apple auth contract smoke passed");
