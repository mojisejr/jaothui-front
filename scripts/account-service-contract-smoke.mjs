import assert from "node:assert/strict";

const accountService = await import("../server/services/account.service.ts");

class InMemoryAccountClient {
  accounts = new Map();
  identities = new Map();
  walletLinks = new Map();
  accountSeq = 0;
  identitySeq = 0;
  walletLinkSeq = 0;

  accountIdentity = {
    findUnique: async ({ where, include }) => {
      const identityKey = this.identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId
      );
      const identity = this.identities.get(identityKey) ?? null;
      if (!identity) return null;
      return {
        ...identity,
        ...(include?.account ? { account: this.hydrateAccount(identity.accountId) } : {}),
      };
    },
    create: async ({ data, include }) => {
      const identityKey = this.identityKey(data.provider, data.providerUserId);
      if (this.identities.has(identityKey)) {
        throw new Error("Unique constraint failed on provider/providerUserId");
      }
      const identity = {
        id: `identity_${++this.identitySeq}`,
        accountId: data.accountId,
        provider: data.provider,
        providerUserId: data.providerUserId,
        email: data.email,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
      };
      this.identities.set(identityKey, identity);
      return {
        ...identity,
        ...(include?.account ? { account: this.hydrateAccount(identity.accountId) } : {}),
      };
    },
    update: async ({ where, data, include }) => {
      const identityKey = this.identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId
      );
      const identity = this.identities.get(identityKey);
      if (!identity) throw new Error("Identity not found");
      identity.email = data.email;
      identity.displayName = data.displayName;
      identity.avatarUrl = data.avatarUrl;
      return {
        ...identity,
        ...(include?.account ? { account: this.hydrateAccount(identity.accountId) } : {}),
      };
    },
    upsert: async ({ where, create, update }) => {
      const identityKey = this.identityKey(
        where.provider_providerUserId.provider,
        where.provider_providerUserId.providerUserId
      );
      const existingIdentity = this.identities.get(identityKey);

      if (existingIdentity) {
        existingIdentity.email = update.email;
        existingIdentity.displayName = update.displayName;
        existingIdentity.avatarUrl = update.avatarUrl;

        const existingAccount = this.accounts.get(existingIdentity.accountId);
        existingAccount.email = update.account.update.email;
        existingAccount.displayName = update.account.update.displayName;
        existingAccount.avatarUrl = update.account.update.avatarUrl;

        return {
          ...existingIdentity,
          account: this.hydrateAccount(existingIdentity.accountId),
        };
      }

      const accountId = `account_${++this.accountSeq}`;
      const account = {
        id: accountId,
        email: create.account.create.email,
        displayName: create.account.create.displayName,
        avatarUrl: create.account.create.avatarUrl,
        role: "USER",
        status: "ACTIVE",
      };
      this.accounts.set(accountId, account);

      const identity = {
        id: `identity_${++this.identitySeq}`,
        accountId,
        provider: create.provider,
        providerUserId: create.providerUserId,
        email: create.email,
        displayName: create.displayName,
        avatarUrl: create.avatarUrl,
      };
      this.identities.set(identityKey, identity);

      return {
        ...identity,
        account: this.hydrateAccount(accountId),
      };
    },
  };

  account = {
    findUnique: async ({ where }) => {
      if (!this.accounts.has(where.id)) {
        return null;
      }
      return this.hydrateAccount(where.id);
    },
  };

  walletLink = {
    findFirst: async ({ where }) => {
      return (
        [...this.walletLinks.values()].find(
          (link) => link.accountId === where.accountId && link.status === where.status
        ) ?? null
      );
    },
    findUnique: async ({ where }) => {
      return this.walletLinks.get(where.walletAddress) ?? null;
    },
    create: async ({ data }) => {
      const linkedAt = new Date();
      const link = {
        id: `wallet_link_${++this.walletLinkSeq}`,
        ...data,
        linkedAt,
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

const firstAccount = await accountService.findOrCreateLineAccount(
  {
    providerUserId: "line-user-1",
    email: "first@example.test",
    displayName: "First Holder",
    avatarUrl: "https://example.test/avatar.png",
  },
  client
);

assert.equal(firstAccount.id, "account_1");
assert.equal(firstAccount.identities[0].provider, "line");
assert.equal(firstAccount.walletLinks.length, 0);

const repeatedAccount = await accountService.findOrCreateLineAccount(
  {
    providerUserId: "line-user-1",
    email: "first-updated@example.test",
    displayName: "First Holder Updated",
  },
  client
);

assert.equal(repeatedAccount.id, firstAccount.id);
assert.equal(repeatedAccount.email, "first-updated@example.test");
assert.equal(client.accounts.size, 1);

const appleAccount = await accountService.findOrCreateAccountIdentity(
  {
    provider: "apple",
    providerUserId: "apple-sub-1",
    email: "apple@example.test",
    displayName: "Apple Holder",
  },
  client
);

assert.equal(appleAccount.id, "account_2");
assert.equal(appleAccount.identities[0].provider, "apple");
assert.equal(appleAccount.identities[0].providerUserId, "apple-sub-1");

const repeatedAppleAccount = await accountService.findOrCreateAccountIdentity(
  {
    provider: "apple",
    providerUserId: "apple-sub-1",
    email: null,
    displayName: "Apple Holder Updated",
  },
  client
);

assert.equal(repeatedAppleAccount.id, appleAccount.id);
assert.equal(client.accounts.size, 2);

const attachedAppleAccount = await accountService.attachIdentityToAccount(
  firstAccount.id,
  {
    provider: "apple",
    providerUserId: "apple-sub-linked-to-line",
    email: "linked-apple@example.test",
    displayName: "Linked Apple",
  },
  client
);

assert.equal(attachedAppleAccount.id, firstAccount.id);
assert.ok(
  attachedAppleAccount.identities.some(
    (identity) =>
      identity.provider === "apple" &&
      identity.providerUserId === "apple-sub-linked-to-line"
  )
);

await assert.rejects(
  () =>
    accountService.attachIdentityToAccount(
      firstAccount.id,
      {
        provider: "apple",
        providerUserId: "apple-sub-1",
      },
      client
    ),
  (error) =>
    error instanceof accountService.AccountIdentityConflictError &&
    error.code === "ACCOUNT_IDENTITY_ALREADY_LINKED" &&
    error.accountId === appleAccount.id
);

const linkedWallet = await accountService.linkWalletToAccount(
  firstAccount.id,
  "  0xABCDEF1234  ",
  { email: "wallet@example.test" },
  client
);

assert.equal(linkedWallet.walletAddress, "0xabcdef1234");
assert.equal(linkedWallet.provider, "bitkub-next");
assert.equal(linkedWallet.status, "LINKED");

const repeatedLink = await accountService.linkWalletToAccount(
  firstAccount.id,
  "0xabcdef1234",
  { email: "ignored@example.test" },
  client
);

assert.equal(repeatedLink.id, linkedWallet.id);
assert.equal(client.walletLinks.size, 1);

const fetchedWallet = await accountService.getLinkedWallet(firstAccount.id, client);
assert.equal(fetchedWallet.id, linkedWallet.id);

const accountProfile = await accountService.getAccountProfile(firstAccount.id, client);
assert.equal(accountProfile.account.id, firstAccount.id);
assert.equal(accountProfile.linkedWallet.walletAddress, "0xabcdef1234");

const secondAccount = await accountService.findOrCreateLineAccount(
  {
    providerUserId: "line-user-2",
  },
  client
);

assert.equal(secondAccount.walletLinks.length, 0);
await assert.rejects(
  () =>
    accountService.linkWalletToAccount(
      secondAccount.id,
      "0xABCDEF1234",
      {},
      client
    ),
  (error) =>
    error instanceof accountService.WalletLinkConflictError &&
    error.code === "WALLET_ALREADY_LINKED" &&
    error.accountId === firstAccount.id
);

assert.throws(() => accountService.normalizeWalletAddress("   "), /walletAddress/);

console.log("Account service contract smoke passed");
