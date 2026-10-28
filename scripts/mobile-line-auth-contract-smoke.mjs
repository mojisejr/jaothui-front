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
        status: "ACTIVE",
        identities: [],
        walletLinks: [],
      },
    }),
  },
  account: {
    findUnique: async () => ({ id: "account_line_mobile", status: "ACTIVE" }),
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

// A native event login is correlated end-to-end; old Profile logins stay unbound.
const flowId = "fixture-event-login-flow-0001";
const flowState = line.createMobileLineOAuthState("jaothui://oauth/callback", { clientFlowId: flowId });
const verifiedFlowState = line.verifyMobileLineOAuthState(flowState);
assert.equal(verifiedFlowState.clientFlowId, flowId);
assert.equal(verifiedState.clientFlowId, undefined);
for (const invalid of ["", "short", "x".repeat(97), "https://other.test", [flowId], 1, null]) {
  assert.throws(() => line.normalizeMobileLineClientFlowId(invalid), /flow ID/);
}
const flowCallback = await line.completeMobileLineCallback({
  code: "fixture-flow-code", state: flowState, accountClient,
  fetcher: async (url) => String(url).includes("/verify")
    ? Response.json({ sub: "line-user-1", nonce: verifiedFlowState.nonce })
    : fetcher(url),
});
assert.equal(new URL(flowCallback.deepLink).searchParams.get("clientFlowId"), flowId);
assert.equal(line.verifyMobileLineOAuthHandoff(flowCallback.handoff).clientFlowId, flowId);
assert.equal(new URL(callback.deepLink).searchParams.has("clientFlowId"), false);
const jwt = (await import("jsonwebtoken")).default;
for (const create of [line.createMobileLineOAuthState, line.createMobileLineOAuthHandoff]) {
  const token = create === line.createMobileLineOAuthState ? flowState : flowCallback.handoff;
  const invalidToken = jwt.sign({ ...jwt.decode(token), clientFlowId: [flowId] }, process.env.JAOTHUI_MOBILE_AUTH_SECRET);
  assert.throws(() => (create === line.createMobileLineOAuthState ? line.verifyMobileLineOAuthState : line.verifyMobileLineOAuthHandoff)(invalidToken), /flow ID/);
}
const sessionHandler = (await import("../pages/api/mobile/v2/auth/line/session.ts")).default;
function response() {
  return { headers: {}, statusCode: 0, setHeader(key, value) { this.headers[key] = value; },
    status(status) { this.statusCode = status; return this; }, json(body) { this.body = body; return this; }, end() { return this; } };
}
for (const [token, requestedId, expected] of [
  [handoff, undefined, 200], [flowCallback.handoff, flowId, 200],
  [flowCallback.handoff, undefined, 409], [flowCallback.handoff, "fixture-event-login-other-0002", 409],
  [handoff, flowId, 409],
]) {
  const res = response();
  sessionHandler({ method: "POST", headers: {}, body: { handoff: token, ...(requestedId ? { clientFlowId: requestedId } : {}) } }, res);
  assert.equal(res.statusCode, expected);
  if (expected === 200) assert.equal(res.body.data.clientFlowId, requestedId);
  else { assert.equal(res.body.error.code, "AUTH_FLOW_MISMATCH"); assert.equal(res.body.data, undefined); }
}

console.log("Mobile LINE auth contract smoke passed; correlated and legacy start/callback/session lanes verified");
