import type { NextApiRequest, NextApiResponse } from "next";

import { createMobileReviewerAccountSession } from "../../../../../server/mobile/auth-session";
import { findOrCreateReviewerSandboxAccount } from "../../../../../server/services/account.service";
import {
  getReviewerSandboxConfig,
  registerReviewerSandboxCredentialFailure,
  reviewerSandboxAllowsAttempt,
  reviewerSandboxCredentialsAreValid,
  REVIEWER_SANDBOX_PROVIDER_USER_ID,
} from "../../../../../server/mobile/reviewer-sandbox";
import { MobileResponse, requireMethod, sendMobileError, sendMobileOk } from "../../../../../server/mobile/response";

type ReviewerSessionResponse = {
  sessionToken: string;
  expiresAt: number;
  identity: { sessionVersion: 2; provider: "reviewer"; accountId: string; providerUserId: string };
};

function requestKey(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return forwardedIp?.trim() || req.socket.remoteAddress || "unknown";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<ReviewerSessionResponse>>
) {
  if (!requireMethod(req, res, "POST")) return;

  const genericDenial = () =>
    sendMobileError(req, res, 401, "UNAUTHORIZED", "Reviewer access is unavailable");

  const config = getReviewerSandboxConfig();
  if (!config.enabled || !config.username || !config.password) return genericDenial();
  const key = requestKey(req);
  if (!reviewerSandboxAllowsAttempt(key)) return genericDenial();
  if (!reviewerSandboxCredentialsAreValid(req.body, config)) {
    registerReviewerSandboxCredentialFailure(key);
    return genericDenial();
  }

  try {
    const account = await findOrCreateReviewerSandboxAccount({
      providerUserId: REVIEWER_SANDBOX_PROVIDER_USER_ID,
    });
    const session = createMobileReviewerAccountSession({
      accountId: account.id,
      providerUserId: REVIEWER_SANDBOX_PROVIDER_USER_ID,
    });
    return sendMobileOk(req, res, {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      identity: {
        sessionVersion: 2,
        provider: "reviewer",
        accountId: account.id,
        providerUserId: REVIEWER_SANDBOX_PROVIDER_USER_ID,
      },
    });
  } catch {
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Reviewer access is unavailable");
  }
}
