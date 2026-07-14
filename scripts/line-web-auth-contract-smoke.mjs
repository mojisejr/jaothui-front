import assert from "node:assert/strict";
import process from "node:process";

process.env.private_procedure_secret = "local-line-web-auth-contract-secret";
process.env.JAOTHUI_LINE_LOGIN_CHANNEL_ID = "2000000000";
process.env.JAOTHUI_LINE_LOGIN_CHANNEL_SECRET = "line-channel-secret";
process.env.JAOTHUI_LINE_LOGIN_CALLBACK_URL =
  "http://localhost:3000/oauth/web/line/callback";

const line = await import("../server/auth/line-web-auth.ts");
const login = await import("../server/auth/line-web-login.ts");
const session = await import("../server/auth/line-web-session.ts");
const bitkub = await import("../server/mobile/bitkub-next-auth.ts");

const config = line.getLineWebAuthConfig();
assert.equal(config.channelId, "2000000000");
assert.equal(config.callbackUrl, "http://localhost:3000/oauth/web/line/callback");
assert.equal(config.scope, "openid profile");

const createdState = line.createWebLineOAuthState("/v2/profile?from=test", {
  nowSeconds: 1000,
});
assert.match(createdState.state, /^[a-f0-9]+$/);
assert.ok(!createdState.state.includes(process.env.JAOTHUI_LINE_LOGIN_CHANNEL_SECRET));
assert.equal(createdState.payload.returnTo, "/v2/profile?from=test");

const verifiedState = line.verifyWebLineOAuthState(createdState.state, {
  nowSeconds: 1001,
});
assert.equal(verifiedState.flow, "web-v2");
assert.equal(verifiedState.returnTo, "/v2/profile?from=test");
assert.equal(verifiedState.nonce, createdState.payload.nonce);

const authorizeUrl = new URL(
  line.buildLineWebAuthorizeUrl({
    state: createdState.state,
    nonce: createdState.payload.nonce,
    config,
  })
);
assert.equal(authorizeUrl.origin, "https://access.line.me");
assert.equal(authorizeUrl.pathname, "/oauth2/v2.1/authorize");
assert.equal(authorizeUrl.searchParams.get("response_type"), "code");
assert.equal(authorizeUrl.searchParams.get("client_id"), "2000000000");
assert.equal(
  authorizeUrl.searchParams.get("redirect_uri"),
  "http://localhost:3000/oauth/web/line/callback"
);
assert.equal(authorizeUrl.searchParams.get("state"), createdState.state);
assert.equal(authorizeUrl.searchParams.get("nonce"), createdState.payload.nonce);
assert.equal(authorizeUrl.searchParams.get("scope"), "openid profile");
assert.ok(!authorizeUrl.toString().includes(process.env.JAOTHUI_LINE_LOGIN_CHANNEL_SECRET));

assert.throws(
  () => line.verifyWebLineOAuthState("invalid-token"),
  /Invalid LINE OAuth state/
);
assert.throws(
  () =>
    line.verifyWebLineOAuthState(`${createdState.state.slice(0, -1)}0`, {
      nowSeconds: 1001,
    }),
  /Invalid LINE OAuth state/
);
assert.throws(
  () => line.verifyWebLineOAuthState(createdState.state, { nowSeconds: 2000 }),
  /Expired LINE OAuth state/
);
assert.throws(
  () => line.normalizeWebLineReturnTo("https://evil.example/v2/profile"),
  /Unsupported LINE login return target/
);
assert.throws(
  () => line.normalizeWebLineReturnTo("/legacy/profile"),
  /Unsupported LINE login return target/
);

const bitkubState = bitkub.createMobileOAuthState("jaothui://oauth/callback");
assert.throws(
  () => line.verifyWebLineOAuthState(bitkubState),
  /Invalid LINE OAuth state/
);

const missingEnv = { ...process.env };
delete missingEnv.JAOTHUI_LINE_LOGIN_CHANNEL_ID;
assert.throws(() => line.getLineWebAuthConfig(missingEnv), /Missing JAOTHUI_LINE_LOGIN_CHANNEL_ID/);

const fetchCalls = [];
const callbackState = line.createWebLineOAuthState("/v2/profile?from=test");
const fakeFetch = async (url, init) => {
  fetchCalls.push({ url: url.toString(), init });
  const body = init?.body?.toString() ?? "";

  if (url.toString() === "https://api.line.me/oauth2/v2.1/token") {
    assert.equal(init.method, "POST");
    assert.equal(init.headers["Content-Type"], "application/x-www-form-urlencoded");
    assert.ok(body.includes("grant_type=authorization_code"));
    assert.ok(body.includes("code=AUTH_CODE"));
    assert.ok(body.includes("client_secret=line-channel-secret"));
    return Response.json({
      access_token: "line-access-token",
      id_token: "line-id-token",
      expires_in: 2592000,
      scope: "openid profile",
      token_type: "Bearer",
    });
  }

  if (url.toString() === "https://api.line.me/oauth2/v2.1/verify") {
    assert.equal(init.method, "POST");
    assert.equal(init.headers["Content-Type"], "application/x-www-form-urlencoded");
    assert.ok(body.includes("id_token=line-id-token"));
    assert.ok(body.includes(`nonce=${callbackState.payload.nonce}`));
    return Response.json({
      iss: "https://access.line.me",
      sub: "U1234567890",
      aud: "2000000000",
      exp: 2000,
      iat: 1000,
      nonce: callbackState.payload.nonce,
      name: "JAOTHUI Holder",
      picture: "https://profile.line-scdn.net/avatar",
      email: "holder@example.test",
    });
  }

  throw new Error(`Unexpected fetch URL: ${url.toString()}`);
};

const callbackResult = await line.completeLineWebCallbackContract({
  code: "AUTH_CODE",
  state: callbackState.state,
  config,
  fetcher: fakeFetch,
});
assert.equal(fetchCalls.length, 2);
assert.equal(callbackResult.state.returnTo, "/v2/profile?from=test");
assert.equal(callbackResult.profile.providerUserId, "U1234567890");
assert.equal(callbackResult.profile.displayName, "JAOTHUI Holder");
assert.equal(callbackResult.profile.avatarUrl, "https://profile.line-scdn.net/avatar");
assert.equal(callbackResult.profile.email, "holder@example.test");

const lineOnlySession = session.createLineWebSession({
  accountId: "account_1",
  lineUserId: "U1234567890",
  email: "holder@example.test",
  displayName: "JAOTHUI Holder",
  avatarUrl: "https://profile.line-scdn.net/avatar",
});
const verifiedLineOnlySession = session.verifyLineWebSessionToken(
  lineOnlySession.token
);
assert.equal(verifiedLineOnlySession.sessionVersion, 1);
assert.equal(verifiedLineOnlySession.primaryProvider, "line");
assert.equal(verifiedLineOnlySession.accountId, "account_1");
assert.equal(verifiedLineOnlySession.lineUserId, "U1234567890");
assert.equal(verifiedLineOnlySession.linkedWallet, null);
assert.ok(!lineOnlySession.token.includes("line-access-token"));
assert.ok(!lineOnlySession.token.includes("line-id-token"));

const linkedWalletSession = session.createLineWebSession({
  accountId: "account_2",
  lineUserId: "U0987654321",
  linkedWallet: {
    walletAddress: "0xabcdef1234",
    provider: "bitkub-next",
    email: "wallet@example.test",
  },
});
assert.deepEqual(
  session.verifyLineWebSessionToken(linkedWalletSession.token).linkedWallet,
  {
    walletAddress: "0xabcdef1234",
    provider: "bitkub-next",
    email: "wallet@example.test",
  }
);
assert.throws(
  () => session.verifyLineWebSessionToken("invalid-token"),
  /jwt malformed|invalid/i
);
assert.throws(
  () =>
    session.createLineWebSession({
      accountId: "",
      lineUserId: "U1234567890",
    }),
  /accountId/
);

const fakeAccountClient = {
  accountIdentity: {
    upsert: async (args) => {
      assert.equal(args.where.provider_providerUserId.provider, "line");
      assert.equal(args.where.provider_providerUserId.providerUserId, "U1234567890");
      assert.equal(args.create.account.create.displayName, "JAOTHUI Holder");
      return {
        account: {
          id: "account_from_line",
          identities: [],
          walletLinks: [],
        },
      };
    },
  },
  account: {
    findUnique: async () => null,
  },
  walletLink: {
    findFirst: async ({ where }) => {
      assert.equal(where.accountId, "account_from_line");
      assert.equal(where.status, "LINKED");
      return {
        walletAddress: "0xlinewallet",
        provider: "bitkub-next",
        email: "wallet@example.test",
      };
    },
    findUnique: async () => null,
    create: async () => null,
  },
};
const loginResult = await login.completeLineWebLogin({
  code: "AUTH_CODE",
  state: callbackState.state,
  config,
  fetcher: fakeFetch,
  accountClient: fakeAccountClient,
});
assert.equal(loginResult.returnTo, "/v2/profile?from=test");
assert.equal(loginResult.account.id, "account_from_line");
const verifiedLoginSession = session.verifyLineWebSessionToken(
  loginResult.session.token
);
assert.equal(verifiedLoginSession.accountId, "account_from_line");
assert.equal(verifiedLoginSession.lineUserId, "U1234567890");
assert.deepEqual(verifiedLoginSession.linkedWallet, {
  walletAddress: "0xlinewallet",
  provider: "bitkub-next",
  email: "wallet@example.test",
});

await assert.rejects(
  () =>
    line.exchangeLineAuthorizationCode({
      code: "AUTH_CODE",
      config,
      fetcher: async () =>
        Response.json({ error: "invalid_grant" }, { status: 400 }),
    }),
  /LINE token exchange failed/
);
await assert.rejects(
  () =>
    line.verifyLineIdToken({
      idToken: "line-id-token",
      nonce: "expected-nonce",
      config,
      fetcher: async () =>
        Response.json({
          sub: "U1234567890",
          nonce: "wrong-nonce",
        }),
    }),
  /nonce mismatch/
);

console.log("LINE web auth contract smoke passed");
