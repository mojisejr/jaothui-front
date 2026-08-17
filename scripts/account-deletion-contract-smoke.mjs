import assert from "node:assert/strict";

process.env.JAOTHUI_MOBILE_AUTH_SECRET = "local-account-deletion-contract-secret";

const accounts = await import("../server/services/account.service.ts");
const auth = await import("../server/mobile/auth-session.ts");
const guard = await import("../server/mobile/account-guard.ts");
const profile = await import("../server/mobile/account-profile.ts");

class InMemoryDeletionClient {
  accounts = new Map();
  identities = new Map();
  walletLinks = new Map();
  nextAccount = 0;
  nextIdentity = 0;
  nextWallet = 0;
  failUpdate = false;

  account = {
    findUnique: async ({ where }) => this.accounts.get(where.id) ?? null,
    update: async ({ where, data, select }) => {
      if (this.failUpdate) throw new Error("injected update failure");
      const account = this.accounts.get(where.id);
      if (!account) throw new Error("Account missing");
      Object.assign(account, data);
      if (!select) return account;
      return Object.fromEntries(Object.keys(select).map((key) => [key, account[key]]));
    },
  };

  accountIdentity = {
    upsert: async ({ where, create, update }) => {
      const key = this.identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId
      );
      const existing = this.identities.get(key);
      if (existing) {
        Object.assign(existing, update);
        const account = this.accounts.get(existing.accountId);
        Object.assign(account, update.account.update);
        return { ...existing, account: this.hydrate(existing.accountId) };
      }
      const accountId = `account_${++this.nextAccount}`;
      const account = {
        id: accountId,
        status: "ACTIVE",
        role: "USER",
        ...create.account.create,
      };
      this.accounts.set(accountId, account);
      const identity = { id: `identity_${++this.nextIdentity}`, accountId, ...create };
      delete identity.account;
      this.identities.set(key, identity);
      return { ...identity, account: this.hydrate(accountId) };
    },
    findUnique: async ({ where }) => {
      const key = this.identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId
      );
      return this.identities.get(key) ?? null;
    },
    create: async ({ data }) => {
      const key = this.identityKey(data.provider, data.providerUserId);
      const identity = { id: `identity_${++this.nextIdentity}`, ...data };
      this.identities.set(key, identity);
      return { ...identity, account: this.hydrate(data.accountId) };
    },
    update: async () => { throw new Error("not needed"); },
    deleteMany: async ({ where }) => {
      let count = 0;
      for (const [key, identity] of this.identities) {
        if (identity.accountId === where.accountId) {
          this.identities.delete(key);
          count++;
        }
      }
      return { count };
    },
  };

  walletLink = {
    findFirst: async ({ where }) =>
      [...this.walletLinks.values()].find(
        (wallet) => wallet.accountId === where.accountId && wallet.status === where.status
      ) ?? null,
    findUnique: async ({ where }) => this.walletLinks.get(where.walletAddress) ?? null,
    create: async ({ data }) => {
      const wallet = { id: `wallet_${++this.nextWallet}`, linkedAt: new Date(), ...data };
      this.walletLinks.set(data.walletAddress, wallet);
      return wallet;
    },
    deleteMany: async ({ where }) => {
      let count = 0;
      for (const [key, wallet] of this.walletLinks) {
        if (wallet.accountId === where.accountId) {
          this.walletLinks.delete(key);
          count++;
        }
      }
      return { count };
    },
  };

  async $transaction(operation) {
    const snapshot = {
      accounts: new Map([...this.accounts].map(([key, value]) => [key, { ...value }])),
      identities: new Map([...this.identities].map(([key, value]) => [key, { ...value }])),
      wallets: new Map([...this.walletLinks].map(([key, value]) => [key, { ...value }])),
    };
    try {
      return await operation(this);
    } catch (error) {
      this.accounts = snapshot.accounts;
      this.identities = snapshot.identities;
      this.walletLinks = snapshot.wallets;
      throw error;
    }
  }

  identityKey(provider, providerUserId) {
    return `${provider}:${providerUserId}`;
  }

  hydrate(accountId) {
    const account = this.accounts.get(accountId);
    return {
      ...account,
      identities: [...this.identities.values()].filter((identity) => identity.accountId === accountId),
      walletLinks: [...this.walletLinks.values()].filter((wallet) => wallet.accountId === accountId),
    };
  }
}

const client = new InMemoryDeletionClient();
const account = await accounts.findOrCreateLineAccount(
  { providerUserId: "line-delete", email: "delete@example.test", displayName: "Delete Me" },
  client
);
await accounts.linkWalletToAccount(account.id, "0xdelete", { email: "wallet@example.test" }, client);

const accountSession = auth.verifyMobileSessionToken(
  auth.createMobileLineAccountSession({
    accountId: account.id,
    lineUserId: "line-delete",
    linkedWallet: { walletAddress: "0xdelete", provider: "bitkub-next", email: null },
  }).token
);
await guard.requireActiveMobileAccountSession(accountSession, client);

client.failUpdate = true;
await assert.rejects(
  () => accounts.softDeleteAccount(account.id, client),
  /injected update failure/
);
client.failUpdate = false;
assert.equal(client.accounts.get(account.id).status, "ACTIVE");
assert.equal(client.identities.size, 1);
assert.equal(client.walletLinks.size, 1);

const receipt = await accounts.softDeleteAccount(account.id, client, {
  now: () => new Date("2026-08-13T00:00:00.000Z"),
});
assert.deepEqual(receipt, {
  deletedAt: new Date("2026-08-13T00:00:00.000Z"),
  deletionPolicyVersion: accounts.ACCOUNT_DELETION_POLICY_VERSION,
  removedIdentityCount: 1,
  removedWalletLinkCount: 1,
});
assert.equal(client.accounts.get(account.id).status, "DELETED");
assert.equal(client.accounts.get(account.id).email, null);
assert.equal(client.accounts.get(account.id).displayName, null);
assert.equal(client.accounts.get(account.id).avatarUrl, null);
assert.equal(client.identities.size, 0);
assert.equal(client.walletLinks.size, 0);

await assert.rejects(
  () => guard.requireActiveMobileAccountSession(accountSession, client),
  (error) => error instanceof accounts.AccountNotActiveError
);
await assert.rejects(
  () => accounts.linkWalletToAccount(account.id, "0xblocked", {}, client),
  (error) => error instanceof accounts.AccountNotActiveError
);

let memberLookups = 0;
const staleProfile = await profile.getMobileAccountProfile(accountSession, {
  getAccountProfile: async () => null,
  getMemberData: async () => {
    memberLookups++;
    return null;
  },
});
assert.equal(staleProfile.identity.linkedWallet, null);
assert.equal(memberLookups, 0);

const freshAccount = await accounts.findOrCreateLineAccount(
  { providerUserId: "line-delete", email: "fresh@example.test" },
  client
);
assert.notEqual(freshAccount.id, account.id);
assert.equal(freshAccount.walletLinks.length, 0);

console.log("Account deletion contract smoke passed");
