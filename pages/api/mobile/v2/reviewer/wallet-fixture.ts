import type { NextApiRequest, NextApiResponse } from "next";

import { requireMobileReviewerAccountSession } from "../../../../../server/mobile/auth-session";
import { requireActiveMobileReviewerSandboxSession } from "../../../../../server/mobile/account-guard";
import { createReviewerWalletFixture, getReviewerSandboxConfig } from "../../../../../server/mobile/reviewer-sandbox";
import { MobileResponse, requireMethod, sendMobileError, sendMobileOk } from "../../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<ReturnType<typeof createReviewerWalletFixture>>>
) {
  if (!requireMethod(req, res, "POST")) return;
  if (!getReviewerSandboxConfig().enabled) {
    return sendMobileError(req, res, 404, "NOT_FOUND", "Not found");
  }
  try {
    const session = requireMobileReviewerAccountSession(req);
    if (!session) return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    await requireActiveMobileReviewerSandboxSession(session);
    if (typeof req.body?.linked !== "boolean") {
      return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing fixture state");
    }
    return sendMobileOk(req, res, createReviewerWalletFixture(req.body.linked));
  } catch {
    return sendMobileError(req, res, 401, "UNAUTHORIZED", "Invalid or expired session");
  }
}
