import {
  exchangeAuthorizationCode,
  getOAuth2AuthorizeURL,
} from "@bitkub-blockchain/react-bitkubnext-oauth2";

import { getUserData } from "../../helpers/getUserData";
import {
  linkWalletToAccount,
  WalletLinkConflictError,
} from "../services/account.service";
import type { MobileLineAccountSessionPayload } from "./auth-session";
import {
  appendWalletLinkHandoffToMobileReturnTo,
  createMobileWalletLinkHandoff,
  createMobileWalletLinkState,
  getBitkubNextClientId,
  getBitkubNextRedirectUrl,
  verifyMobileWalletLinkHandoff,
  verifyMobileWalletLinkState,
} from "./bitkub-next-auth";

export function buildMobileBitkubNextLinkAuthorizeUrl(input: {
  accountId: string;
  returnTo?: string;
}) {
  const state = createMobileWalletLinkState({
    accountId: input.accountId,
    returnTo: input.returnTo ?? "jaothui://oauth/callback",
  });

  return {
    authUrl: getBitkubNextLinkAuthorizeUrl(state),
    state,
  };
}

function getBitkubNextLinkAuthorizeUrl(state: string) {
  return getOAuth2AuthorizeURL(
    getBitkubNextClientId(),
    getBitkubNextRedirectUrl(),
    state
  );
}

export async function createMobileBitkubNextLinkDeepLink(input: {
  code: string;
  state: string;
}) {
  const verifiedState = verifyMobileWalletLinkState(input.state);
  const tokens = await exchangeAuthorizationCode(
    getBitkubNextClientId(),
    getBitkubNextRedirectUrl(),
    input.code
  );

  if (!tokens?.access_token) {
    throw new Error("Unable to exchange authorization code");
  }

  const userData = await getUserData(tokens.access_token);
  if (!userData.success || !userData.wallet_address) {
    throw new Error("Unable to validate Bitkub NEXT user");
  }

  const linkedWallet = await linkWalletToAccount(
    verifiedState.accountId,
    userData.wallet_address,
    {
      email: typeof userData.email === "string" ? userData.email : null,
      verifiedAt: new Date(),
    }
  );

  const handoff = createMobileWalletLinkHandoff({
    accountId: verifiedState.accountId,
    walletAddress: linkedWallet.walletAddress,
    email: typeof linkedWallet.email === "string" ? linkedWallet.email : null,
  });

  return appendWalletLinkHandoffToMobileReturnTo(verifiedState.returnTo, handoff);
}

export function createRefreshedLineSessionInput(input: {
  session: MobileLineAccountSessionPayload;
  handoff: string;
}) {
  const verifiedHandoff = verifyMobileWalletLinkHandoff(input.handoff);
  if (verifiedHandoff.accountId !== input.session.accountId) {
    throw new Error("Mobile wallet link handoff does not match LINE account");
  }

  return {
    accountId: input.session.accountId,
    lineUserId: input.session.lineUserId,
    email: input.session.email,
    displayName: input.session.displayName,
    avatarUrl: input.session.avatarUrl,
    linkedWallet: verifiedHandoff.linkedWallet,
  };
}

export function toMobileWalletLinkErrorCode(error: unknown) {
  if (error instanceof WalletLinkConflictError) {
    return "WALLET_ALREADY_LINKED";
  }
  if (error instanceof Error && /handoff|account/i.test(error.message)) {
    return "INVALID_WALLET_LINK_HANDOFF";
  }
  return "MOBILE_WALLET_LINK_FAILED";
}
