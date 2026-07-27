import assert from "node:assert/strict";
import process from "node:process";
import jwt from "jsonwebtoken";

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
assert.equal(verifiedSession.sessionVersion, undefined);

const lineOnlySession = session.createMobileLineAccountSession({
  accountId: "account_1",
  lineUserId: "line-user-1",
  email: "line@example.test",
  displayName: "Line Holder",
  avatarUrl: "https://example.test/avatar.png",
});
const verifiedLineOnlySession = session.verifyMobileSessionToken(lineOnlySession.token);
assert.equal(verifiedLineOnlySession.sessionVersion, 2);
assert.equal(verifiedLineOnlySession.primaryProvider, "line");
assert.equal(verifiedLineOnlySession.accountId, "account_1");
assert.equal(verifiedLineOnlySession.providerUserId, "line-user-1");
assert.equal(verifiedLineOnlySession.lineUserId, "line-user-1");
assert.equal(verifiedLineOnlySession.email, "line@example.test");
assert.equal(verifiedLineOnlySession.displayName, "Line Holder");
assert.equal(verifiedLineOnlySession.avatarUrl, "https://example.test/avatar.png");
assert.equal(verifiedLineOnlySession.linkedWallet, null);
assert.throws(
  () =>
    session.requireMobileBitkubNextSession({
      headers: {
        authorization: `Bearer ${lineOnlySession.token}`,
      },
    }),
  /Invalid mobile session token/
);

const lineLinkedWalletSession = session.createMobileLineAccountSession({
  accountId: "account_2",
  lineUserId: "line-user-2",
  linkedWallet: {
    walletAddress: "0xabcdef1234",
    provider: "bitkub-next",
    email: "wallet@example.test",
  },
});
const verifiedLineLinkedWalletSession = session.verifyMobileSessionToken(
  lineLinkedWalletSession.token
);
assert.equal(verifiedLineLinkedWalletSession.sessionVersion, 2);
assert.deepEqual(verifiedLineLinkedWalletSession.linkedWallet, {
  walletAddress: "0xabcdef1234",
  provider: "bitkub-next",
  email: "wallet@example.test",
});

const appleSession = session.createMobileAccountSession({
  accountId: "account_apple",
  primaryProvider: "apple",
  providerUserId: "apple-sub-1",
  email: "apple@example.test",
  displayName: "Apple Holder",
});
const verifiedAppleSession = session.verifyMobileSessionToken(appleSession.token);
assert.equal(verifiedAppleSession.sessionVersion, 2);
assert.equal(verifiedAppleSession.primaryProvider, "apple");
assert.equal(verifiedAppleSession.accountId, "account_apple");
assert.equal(verifiedAppleSession.providerUserId, "apple-sub-1");
assert.equal(verifiedAppleSession.appleUserId, "apple-sub-1");
assert.equal(verifiedAppleSession.email, "apple@example.test");
assert.equal(verifiedAppleSession.displayName, "Apple Holder");
assert.equal(verifiedAppleSession.linkedWallet, null);
assert.equal(
  session.requireMobileAccountSession({
    headers: {
      authorization: `Bearer ${appleSession.token}`,
    },
  }).accountId,
  "account_apple"
);
assert.throws(
  () =>
    session.requireMobileLineAccountSession({
      headers: {
        authorization: `Bearer ${appleSession.token}`,
      },
    }),
  /Invalid mobile session token/
);

assert.throws(
  () => session.verifyMobileSessionToken("invalid-token"),
  /jwt malformed|invalid/i
);
assert.throws(
  () => bridge.verifyMobileOAuthHandoff("invalid-token"),
  /jwt malformed|invalid/i
);
assert.throws(
  () =>
    session.createMobileLineAccountSession({
      accountId: "",
      lineUserId: "line-user-3",
    }),
  /accountId/
);
assert.throws(
  () =>
    session.createMobileAccountSession({
      accountId: "account_apple",
      primaryProvider: "apple",
      providerUserId: "",
    }),
  /providerUserId/
);
assert.throws(
  () =>
    session.verifyMobileSessionToken(
      jwt.sign(
        {
          typ: "jaothui-mobile-session",
          sessionVersion: 2,
          primaryProvider: "line",
          lineUserId: "line-user-missing-account",
        },
        process.env.private_procedure_secret,
        {
          algorithm: "HS256",
          audience: "jaothui-mobile",
          issuer: "jaothui",
        }
      )
    ),
  /Invalid mobile session token/
);
assert.throws(
  () =>
    session.verifyMobileSessionToken(
      jwt.sign(
        {
          typ: "jaothui-mobile-session",
          sessionVersion: 2,
          provider: "bitkub-next",
          walletAddress: "0xabcdef",
        },
        process.env.private_procedure_secret,
        {
          algorithm: "HS256",
          audience: "jaothui-mobile",
          issuer: "jaothui",
        }
      )
    ),
  /Invalid mobile session token/
);

assert.ok(!mobileSession.token.includes("access_token"));
assert.ok(!mobileSession.token.includes("refresh_token"));

console.log("Mobile auth contract smoke passed");
