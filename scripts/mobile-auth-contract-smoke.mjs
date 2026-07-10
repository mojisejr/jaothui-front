import assert from "node:assert/strict";
import process from "node:process";

process.env.private_procedure_secret = "local-mobile-auth-contract-secret";

const bridge = await import("../server/mobile/bitkub-next-auth.ts");
const session = await import("../server/mobile/auth-session.ts");

const handoff = bridge.createMobileOAuthHandoff({
  walletAddress: "0x1234567890abcdef",
  email: "holder@example.test",
});
const verifiedHandoff = bridge.verifyMobileOAuthHandoff(handoff);
assert.equal(verifiedHandoff.walletAddress, "0x1234567890abcdef");
assert.equal(verifiedHandoff.email, "holder@example.test");

const mobileSession = session.createMobileSession({
  walletAddress: verifiedHandoff.walletAddress,
  email: verifiedHandoff.email,
});
assert.ok(mobileSession.sessionToken || mobileSession.token);
assert.ok(mobileSession.expiresAt > Math.floor(Date.now() / 1000));

const verifiedSession = session.verifyMobileSessionToken(
  mobileSession.sessionToken ?? mobileSession.token
);
assert.equal(verifiedSession.walletAddress, "0x1234567890abcdef");
assert.equal(verifiedSession.email, "holder@example.test");
assert.equal(verifiedSession.provider, "bitkub-next");

assert.throws(
  () => session.verifyMobileSessionToken("invalid-token"),
  /jwt malformed|invalid/i
);
assert.throws(
  () => bridge.verifyMobileOAuthHandoff("invalid-token"),
  /jwt malformed|invalid/i
);

assert.ok(!mobileSession.token.includes("access_token"));
assert.ok(!mobileSession.token.includes("refresh_token"));

console.log("Mobile auth contract smoke passed");
