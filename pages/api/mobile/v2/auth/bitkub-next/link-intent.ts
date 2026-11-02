import type { NextApiRequest, NextApiResponse } from "next";
import { sendMobileAuthFailure } from "../../../../../../server/mobile/auth-failure";

import { requireMobileCustomerAccountSession } from "../../../../../../server/mobile/auth-session";
import {
  requireActiveMobileAccountSession,
} from "../../../../../../server/mobile/account-guard";
import { buildMobileBitkubNextLinkAuthorizeUrl } from "../../../../../../server/mobile/bitkub-next-link";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../server/mobile/response";

type MobileWalletLinkIntent = {
  authUrl: string;
  returnTo: "jaothui://oauth/callback";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileWalletLinkIntent>>
) {
  if (!requireMethod(req, res, "POST")) return;

  try {
    const session = requireMobileCustomerAccountSession(req);
    if (!session) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    await requireActiveMobileAccountSession(session);

    const intent = buildMobileBitkubNextLinkAuthorizeUrl({
      accountId: session.accountId,
      returnTo: "jaothui://oauth/callback",
    });

    return sendMobileOk(req, res, {
      authUrl: intent.authUrl,
      returnTo: "jaothui://oauth/callback",
    });
  } catch (error) {
    return sendMobileAuthFailure(req, res, error, {
      flow: "mobile_wallet", stage: "wallet_link", failureMessage: "Unable to start Bitkub NEXT wallet link",
    });
  }
}
