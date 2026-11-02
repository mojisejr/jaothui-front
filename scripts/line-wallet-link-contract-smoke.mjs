import assert from "node:assert/strict";

process.env.private_procedure_secret = "local-line-wallet-link-contract-secret";

const accountService = await import("../server/services/account.service.ts");
const lineSession = await import("../server/auth/line-web-session.ts");
const lineAccount = await import("../server/auth/line-web-account.ts");
const walletLink = await import("../server/auth/line-web-wallet-link.ts");
const lineWalletRoute = await import("../pages/api/auth/line/link-bitkub-next.ts");

class InMemoryAccountClient {
  accounts = new Map();
  identities = new Map();
  walletLinks = new Map();
  accountSeq = 0;
  identitySeq = 0;
  walletLinkSeq = 0;

  accountIdentity = {
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
const account = await accountService.findOrCreateLineAccount(
  {
    providerUserId: "line-user-1",
    email: "line@example.test",
    displayName: "LINE Holder",
    avatarUrl: "https://example.test/line.png",
  },
  client
);

const session = lineSession.createLineWebSession({
  accountId: account.id,
  lineUserId: "line-user-1",
  email: "line@example.test",
  displayName: "LINE Holder",
  avatarUrl: "https://example.test/line.png",
}).payload;

const beforeLink = await lineAccount.getFreshLineWebAccount(session, client);
assert.equal(beforeLink.linkedWallet, null);

const fetchValidBitkubUser = async (token) => {
  assert.equal(token, "valid-bitkub-token");
  return {
    success: true,
    wallet_address: "  0xABCDEF1234  ",
    email: "wallet@example.test",
  };
};

const linkedAccount = await walletLink.linkBitkubNextWalletToLineAccount({
  session,
  accessToken: " valid-bitkub-token ",
  client,
  fetchBitkubUserData: fetchValidBitkubUser,
  now: () => new Date("2026-07-14T00:00:00.000Z"),
});

assert.equal(linkedAccount.accountId, account.id);
assert.deepEqual(linkedAccount.linkedWallet, {
  walletAddress: "0xabcdef1234",
  provider: "bitkub-next",
  email: "wallet@example.test",
});

const freshAfterLink = await lineAccount.getFreshLineWebAccount(session, client);
assert.deepEqual(freshAfterLink.linkedWallet, linkedAccount.linkedWallet);
assert.equal(client.walletLinks.size, 1);

const repeatedLink = await walletLink.linkBitkubNextWalletToLineAccount({
  session,
  accessToken: " valid-bitkub-token ",
  client,
  fetchBitkubUserData: fetchValidBitkubUser,
});
assert.deepEqual(repeatedLink.linkedWallet, linkedAccount.linkedWallet);
assert.equal(client.walletLinks.size, 1);

await assert.rejects(
  () =>
    walletLink.linkBitkubNextWalletToLineAccount({
      session,
      accessToken: "invalid-token",
      client,
      fetchBitkubUserData: async () => ({ success: false }),
    }),
  (error) => error instanceof walletLink.BitkubNextAuthError
);

const secondAccount = await accountService.findOrCreateLineAccount(
  {
    providerUserId: "line-user-2",
  },
  client
);
const secondSession = lineSession.createLineWebSession({
  accountId: secondAccount.id,
  lineUserId: "line-user-2",
}).payload;

await assert.rejects(
  () =>
    walletLink.linkBitkubNextWalletToLineAccount({
      session: secondSession,
      accessToken: "valid-bitkub-token",
      client,
      fetchBitkubUserData: fetchValidBitkubUser,
    }),
  (error) => {
    const response = walletLink.toWalletLinkErrorResponse(error);
    assert.equal(response.status, 409);
    assert.equal(response.body.code, "WALLET_ALREADY_LINKED");
    return error instanceof accountService.WalletLinkConflictError;
  }
);

const invalidTokenResponse = walletLink.toWalletLinkErrorResponse(
  new walletLink.BitkubNextAuthError()
);
assert.equal(invalidTokenResponse.status, 401);
assert.equal(invalidTokenResponse.body.code, "BITKUB_NEXT_AUTH_INVALID");

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const methodRes = createMockResponse();
await lineWalletRoute.default(
  {
    method: "GET",
    cookies: {},
    headers: {},
  },
  methodRes
);
assert.equal(methodRes.statusCode, 405);
assert.equal(methodRes.body.success, false);

const noLineSessionRes = createMockResponse();
await lineWalletRoute.default(
  {
    method: "POST",
    cookies: {},
    headers: {},
  },
  noLineSessionRes
);
assert.equal(noLineSessionRes.statusCode, 401);
assert.equal(noLineSessionRes.body.code, "LINE_SESSION_MISSING");

const missingBitkubRes = createMockResponse();
await lineWalletRoute.default(
  {
    method: "POST",
    cookies: {
      [lineSession.LINE_WEB_SESSION_COOKIE]: lineSession.createLineWebSession({
        accountId: account.id,
        lineUserId: "line-user-1",
      }).token,
    },
    headers: {},
  },
  missingBitkubRes
);
assert.equal(missingBitkubRes.statusCode, 401);
assert.equal(missingBitkubRes.body.code, "BITKUB_NEXT_AUTH_MISSING");

console.log("LINE wallet link contract smoke passed");
