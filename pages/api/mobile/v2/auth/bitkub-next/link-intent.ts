import type { NextApiRequest, NextApiResponse } from "next";

import { requireMobileAccountSession } from "../../../../../../server/mobile/auth-session";
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

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileWalletLinkIntent>>
) {
  if (!requireMethod(req, res, "POST")) return;

  try {
    const session = requireMobileAccountSession(req);
    if (!session) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    const intent = buildMobileBitkubNextLinkAuthorizeUrl({
      accountId: session.accountId,
      returnTo: "jaothui://oauth/callback",
    });

    return sendMobileOk(req, res, {
      authUrl: intent.authUrl,
      returnTo: "jaothui://oauth/callback",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      /session|jwt|token|expired|signature/i.test(error.message)
    ) {
      return sendMobileError(
        req,
        res,
        401,
        "UNAUTHORIZED",
        "A JAOTHUI account session is required to link Bitkub NEXT"
      );
    }

    console.error("Mobile Bitkub NEXT link intent error:", error);
    return sendMobileError(
      req,
      res,
      500,
      "INTERNAL_ERROR",
      "Unable to start Bitkub NEXT wallet link"
    );
  }
}
