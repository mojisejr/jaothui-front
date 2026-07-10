import { exchangeAuthorizationCode } from "@bitkub-blockchain/react-bitkubnext-oauth2";

import { getUserData } from "../../helpers/getUserData";
import { hasUser, registerUser } from "../services/user.service";
import {
  appendHandoffToMobileReturnTo,
  createMobileOAuthHandoff,
  getBitkubNextClientId,
  getBitkubNextRedirectUrl,
  verifyMobileOAuthState,
} from "./bitkub-next-auth";

async function registerUserBestEffort(wallet: string, email: string | null) {
  try {
    const foundUser = await hasUser(wallet);
    if (!foundUser) {
      await registerUser({ wallet, email, name: null, tel: null });
    }
  } catch (error) {
    console.warn(
      "Mobile Bitkub NEXT handoff skipped user registration:",
      error instanceof Error ? error.message : "unknown error"
    );
  }
}

export async function createMobileBitkubNextDeepLink(input: {
  code: string;
  state: string;
}) {
  const verifiedState = verifyMobileOAuthState(input.state);
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

  await registerUserBestEffort(userData.wallet_address, userData.email ?? null);

  const handoff = createMobileOAuthHandoff({
    walletAddress: userData.wallet_address,
    email: userData.email ?? null,
  });

  return appendHandoffToMobileReturnTo(verifiedState.returnTo, handoff);
}
