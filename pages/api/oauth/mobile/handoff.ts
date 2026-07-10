import type { NextApiRequest, NextApiResponse } from "next";
import { exchangeAuthorizationCode } from "@bitkub-blockchain/react-bitkubnext-oauth2";

import { getUserData } from "../../../../helpers/getUserData";
import {
  appendHandoffToMobileReturnTo,
  createMobileOAuthHandoff,
  getBitkubNextClientId,
  getBitkubNextRedirectUrl,
  verifyMobileOAuthState,
} from "../../../../server/mobile/bitkub-next-auth";
import { hasUser, registerUser } from "../../../../server/services/user.service";

type MobileHandoffResponse =
  | {
      success: true;
      deepLink: string;
    }
  | {
      success: false;
      message: string;
    };

function getBodyString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileHandoffResponse>
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Allow", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Use POST" });
  }

  const code = getBodyString(req.body?.code);
  const state = getBodyString(req.body?.state);

  if (!code || !state) {
    return res
      .status(400)
      .json({ success: false, message: "Missing authorization code or state" });
  }

  try {
    const verifiedState = verifyMobileOAuthState(state);
    const tokens = await exchangeAuthorizationCode(
      getBitkubNextClientId(),
      getBitkubNextRedirectUrl(),
      code
    );

    if (!tokens?.access_token) {
      return res
        .status(401)
        .json({ success: false, message: "Unable to exchange authorization code" });
    }

    const userData = await getUserData(tokens.access_token);
    if (!userData.success || !userData.wallet_address) {
      return res
        .status(401)
        .json({ success: false, message: "Unable to validate Bitkub NEXT user" });
    }

    await registerUserBestEffort(userData.wallet_address, userData.email ?? null);

    const handoff = createMobileOAuthHandoff({
      walletAddress: userData.wallet_address,
      email: userData.email ?? null,
    });

    return res.status(200).json({
      success: true,
      deepLink: appendHandoffToMobileReturnTo(verifiedState.returnTo, handoff),
    });
  } catch (error) {
    console.error(
      "Mobile Bitkub NEXT handoff failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return res
      .status(400)
      .json({ success: false, message: "Unable to complete mobile authentication" });
  }
}
