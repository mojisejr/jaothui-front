import type { NextApiRequest, NextApiResponse } from "next";
import { sendMobileAuthFailure } from "../../../../server/mobile/auth-failure";

import { requireMobileBitkubNextSession } from "../../../../server/mobile/auth-session";
import { getMobileProfile } from "../../../../server/mobile/profile";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileProfile>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  try {
    const session = requireMobileBitkubNextSession(req);
    if (!session) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    return sendMobileOk(req, res, await getMobileProfile(session));
  } catch (error) {
    return sendMobileAuthFailure(req, res, error, {
      flow: "mobile_legacy", stage: "profile_read", failureMessage: "Unable to load profile",
    });
  }
}
