import type { NextApiRequest, NextApiResponse } from "next";
import { sendMobileAuthFailure } from "../../../../server/mobile/auth-failure";

import { requireMobileSession } from "../../../../server/mobile/auth-session";
import {
  requireActiveMobileAccountSession,
} from "../../../../server/mobile/account-guard";
import { getMobileAccountProfile } from "../../../../server/mobile/account-profile";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileAccountProfile>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  try {
    const session = requireMobileSession(req);
    if (!session) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    await requireActiveMobileAccountSession(session);

    return sendMobileOk(req, res, await getMobileAccountProfile(session));
  } catch (error) {
    return sendMobileAuthFailure(req, res, error, {
      flow: "mobile_account", stage: "profile_read", failureMessage: "Unable to load profile",
    });
  }
}
