import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

process.env.JAOTHUI_MOBILE_AUTH_SECRET = "local-mobile-wallet-link-secret";
process.env.NEXT_PUBLIC_client_id_prod = "bitkub-client-id";
process.env.NEXT_PUBLIC_redirect_prod = "https://www.jaothui.com/oauth/callback";
process.env.NODE_ENV = "production";

const auth = await import("../server/mobile/auth-session.ts");
const bitkub = await import("../server/mobile/bitkub-next-auth.ts");
const link = await import("../server/mobile/bitkub-next-link.ts");

const lineSessionToken = auth.createMobileLineAccountSession({
  accountId: "account_link_owner",
  lineUserId: "line-user-1",
  email: "line@example.test",
  displayName: "LINE Holder",
});
const lineSession = auth.verifyMobileSessionToken(lineSessionToken.token);
assert.equal(auth.requireMobileLineAccountSession({
  headers: { authorization: `Bearer ${lineSessionToken.token}` },
}).accountId, "account_link_owner");

const legacyBitkubToken = auth.createMobileSession({
  walletAddress: "0xlegacy",
});
assert.throws(
  () =>
    auth.requireMobileLineAccountSession({
      headers: { authorization: `Bearer ${legacyBitkubToken.token}` },
    }),
  /Invalid mobile session token/
);

const state = bitkub.createMobileWalletLinkState({
  accountId: lineSession.accountId,
  returnTo: "jaothui://oauth/callback",
});
const verifiedState = bitkub.verifyMobileWalletLinkState(state);
assert.equal(verifiedState.purpose, "link");
assert.equal(verifiedState.accountId, "account_link_owner");

const intent = link.buildMobileBitkubNextLinkAuthorizeUrl({
  accountId: lineSession.accountId,
});
const parsedIntent = new URL(intent.authUrl);
assert.equal(parsedIntent.searchParams.get("client_id"), "bitkub-client-id");
assert.equal(
  parsedIntent.searchParams.get("redirect_uri"),
  "https://www.jaothui.com/oauth/callback"
);

const handoff = bitkub.createMobileWalletLinkHandoff({
  accountId: lineSession.accountId,
  walletAddress: "0xlinked",
  email: "wallet@example.test",
});
const deepLink = bitkub.appendWalletLinkHandoffToMobileReturnTo(
  "jaothui://oauth/callback",
  handoff
);
const parsedDeepLink = new URL(deepLink);
assert.equal(parsedDeepLink.searchParams.get("provider"), "bitkub-next");
assert.equal(parsedDeepLink.searchParams.get("purpose"), "link");
assert.ok(parsedDeepLink.searchParams.get("handoff"));
assert.ok(!deepLink.includes("access_token"));
assert.ok(!deepLink.includes("refresh_token"));

const refreshedInput = link.createRefreshedLineSessionInput({
  session: lineSession,
  handoff,
});
assert.equal(refreshedInput.accountId, "account_link_owner");
assert.deepEqual(refreshedInput.linkedWallet, {
  walletAddress: "0xlinked",
  provider: "bitkub-next",
  email: "wallet@example.test",
});

const mismatchedHandoff = bitkub.createMobileWalletLinkHandoff({
  accountId: "other_account",
  walletAddress: "0xlinked",
});
assert.throws(
  () =>
    link.createRefreshedLineSessionInput({
      session: lineSession,
      handoff: mismatchedHandoff,
    }),
  /does not match/
);

const root = path.resolve(import.meta.dirname, "..");
const linkSource = readFileSync(
  path.join(root, "server/mobile/bitkub-next-link.ts"),
  "utf8"
);
assert.ok(linkSource.includes("getUserData(tokens.access_token)"));
assert.ok(linkSource.includes("linkWalletToAccount("));
assert.ok(!linkSource.includes("req.body.walletAddress"));

console.log("Mobile wallet link contract smoke passed");
