import type { NextApiRequest, NextApiResponse } from "next";

import {
  requireMobileSession,
  type MobileSessionPayload,
} from "../../../../server/mobile/auth-session";
import {
  toMobileAccountIdentity,
  type MobileAccountIdentity,
} from "../../../../server/mobile/account-profile";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../server/mobile/response";

type MobileV2Me = {
  identity: MobileAccountIdentity;
};

function getLinkedWalletFromSession(session: MobileSessionPayload) {
  return "linkedWallet" in session ? session.linkedWallet : undefined;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileV2Me>>
) {
  if (!requireMethod(req, res, "GET")) return;

  try {
    const session = requireMobileSession(req);
    if (!session) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    return sendMobileOk(req, res, {
      identity: toMobileAccountIdentity(session, getLinkedWalletFromSession(session)),
    });
  } catch {
    return sendMobileError(req, res, 401, "UNAUTHORIZED", "Invalid or expired session");
  }
}

