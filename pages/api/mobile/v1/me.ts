import type { NextApiRequest, NextApiResponse } from "next";
import { sendMobileAuthFailure } from "../../../../server/mobile/auth-failure";

import { requireMobileBitkubNextSession } from "../../../../server/mobile/auth-session";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../server/mobile/response";

type MobileMe = {
  walletAddress: string;
  email: string | null;
  provider: "bitkub-next";
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileMe>>
) {
  if (!requireMethod(req, res, "GET")) return;

  try {
    const session = requireMobileBitkubNextSession(req);
    if (!session) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    return sendMobileOk(req, res, {
      walletAddress: session.walletAddress,
      email: session.email,
      provider: session.provider,
    });
  } catch (error) {
    return sendMobileAuthFailure(req, res, error, {
      flow: "mobile_legacy", stage: "profile_read", failureMessage: "Unable to load account",
    });
  }
}
