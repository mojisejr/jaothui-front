import type { NextApiRequest, NextApiResponse } from "next";

import { requireMobileSession } from "../../../../server/mobile/auth-session";
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

    return sendMobileOk(req, res, await getMobileAccountProfile(session));
  } catch (error) {
    if (
      error instanceof Error &&
      /session|jwt|token|expired|signature/i.test(error.message)
    ) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Invalid or expired session");
    }

    console.error("Mobile v2 profile error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load profile");
  }
}

