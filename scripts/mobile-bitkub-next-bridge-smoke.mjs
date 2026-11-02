import assert from "node:assert/strict";
import process from "node:process";

process.env.private_procedure_secret = "local-mobile-bridge-smoke-secret";
process.env.NEXT_PUBLIC_client_id_dev = "local-client-id";
process.env.NEXT_PUBLIC_redirect_dev = "https://www.jaothui.com/oauth/callback";
process.env.NODE_ENV = "development";

const auth = await import("../server/mobile/bitkub-next-auth.ts");

const state = auth.createMobileOAuthState("jaothui://oauth/callback");
const verifiedState = auth.verifyMobileOAuthState(state);
assert.equal(verifiedState.flow, "mobile");
assert.equal(verifiedState.returnTo, "jaothui://oauth/callback");

const authorizeUrl = auth.buildBitkubNextAuthorizeUrl(state);
assert.ok(authorizeUrl.startsWith("https://accounts.bitkubnext.com/oauth2/authorize?"));
assert.ok(authorizeUrl.includes("response_type=code"));
assert.ok(authorizeUrl.includes("client_id=local-client-id"));
assert.ok(
  authorizeUrl.includes(
    `redirect_uri=${encodeURIComponent("https://www.jaothui.com/oauth/callback")}`
  )
);
assert.ok(authorizeUrl.includes(`state=${state}`));

assert.throws(
  () => auth.normalizeMobileReturnTo("https://evil.example/oauth/callback"),
  /Unsupported mobile OAuth return target/
);
assert.throws(
  () => auth.normalizeMobileReturnTo("jaothui://oauth/callback?next=https://evil.example"),
  /Unsupported mobile OAuth return target/
);

const handoff = auth.createMobileOAuthHandoff({
  walletAddress: "0x1234567890abcdef",
  email: "holder@example.test",
});
const verifiedHandoff = auth.verifyMobileOAuthHandoff(handoff);
assert.equal(verifiedHandoff.flow, "mobile");
assert.equal(verifiedHandoff.walletAddress, "0x1234567890abcdef");
assert.equal(verifiedHandoff.email, "holder@example.test");

const deepLink = auth.appendHandoffToMobileReturnTo(
  verifiedState.returnTo,
  handoff
);
assert.ok(deepLink.startsWith("jaothui://oauth/callback?handoff="));
assert.ok(!deepLink.includes("access_token"));
assert.ok(!deepLink.includes("refresh_token"));

console.log("Mobile Bitkub NEXT bridge smoke passed");
