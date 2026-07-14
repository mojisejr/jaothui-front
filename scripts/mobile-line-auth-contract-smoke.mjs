import assert from "node:assert/strict";
import process from "node:process";

process.env.JAOTHUI_MOBILE_AUTH_SECRET = "local-mobile-line-auth-secret";
process.env.JAOTHUI_LINE_LOGIN_CHANNEL_ID = "2000000000";
process.env.JAOTHUI_LINE_LOGIN_CHANNEL_SECRET = "line-channel-secret";
process.env.JAOTHUI_LINE_MOBILE_CALLBACK_URL =
  "https://www.jaothui.com/oauth/mobile/line/callback";

const line = await import("../server/mobile/line-auth.ts");
const session = await import("../server/mobile/auth-session.ts");

const state = line.createMobileLineOAuthState("jaothui://oauth/callback");
const verifiedState = line.verifyMobileLineOAuthState(state);
assert.equal(verifiedState.flow, "mobile-line");
assert.equal(verifiedState.returnTo, "jaothui://oauth/callback");

const authorizeUrl = line.buildMobileLineAuthorizeUrl({
  state,
  nonce: verifiedState.nonce,
});
const parsedAuthorizeUrl = new URL(authorizeUrl);
assert.equal(parsedAuthorizeUrl.hostname, "access.line.me");
assert.equal(
  parsedAuthorizeUrl.searchParams.get("redirect_uri"),
  "https://www.jaothui.com/oauth/mobile/line/callback"
);
assert.ok(!authorizeUrl.includes(process.env.JAOTHUI_LINE_LOGIN_CHANNEL_SECRET));

assert.throws(
  () => line.normalizeMobileLineReturnTo("https://evil.example/oauth/callback"),
  /Unsupported mobile LINE return target/
);
assert.throws(
  () => line.verifyMobileLineOAuthState("invalid-token"),
  /jwt malformed|invalid/i
);

const accountClient = {
  accountIdentity: {
    upsert: async () => ({
      account: {
        id: "account_line_mobile",
        identities: [],
        walletLinks: [],
      },
    }),
  },
  account: {
    findUnique: async () => null,
  },
  walletLink: {
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => null,
  },
};
const fetcher = async (url) => {
  if (String(url).includes("/token")) {
    return Response.json({
      access_token: "line-access-token",
      id_token: "line-id-token",
      expires_in: 3600,
      scope: "openid profile",
      token_type: "Bearer",
    });
  }
  if (String(url).includes("/verify")) {
    return Response.json({
      sub: "line-user-1",
      name: "LINE Holder",
      picture: "https://profile.line-scdn.net/avatar",
      email: "line@example.test",
      nonce: verifiedState.nonce,
    });
  }
  throw new Error(`Unexpected fetch URL: ${url}`);
};
const callback = await line.completeMobileLineCallback({
  code: "authorization-code",
  state,
  fetcher,
  accountClient,
});
assert.equal(callback.account.id, "account_line_mobile");
assert.ok(callback.deepLink.startsWith("jaothui://oauth/callback?"));
assert.equal(new URL(callback.deepLink).searchParams.get("provider"), "line");
assert.ok(new URL(callback.deepLink).searchParams.get("handoff"));
assert.ok(!callback.deepLink.includes("line-access-token"));
assert.ok(!callback.deepLink.includes("line-id-token"));

const handoff = new URL(callback.deepLink).searchParams.get("handoff");
const verifiedHandoff = line.verifyMobileLineOAuthHandoff(handoff);
assert.equal(verifiedHandoff.accountId, "account_line_mobile");
assert.equal(verifiedHandoff.lineUserId, "line-user-1");
assert.equal(verifiedHandoff.linkedWallet, null);

const mobileSession = session.createMobileLineAccountSession(verifiedHandoff);
const verifiedSession = session.verifyMobileSessionToken(mobileSession.token);
assert.equal(verifiedSession.sessionVersion, 2);
assert.equal(verifiedSession.primaryProvider, "line");
assert.equal(verifiedSession.accountId, "account_line_mobile");

console.log("Mobile LINE auth contract smoke passed");
