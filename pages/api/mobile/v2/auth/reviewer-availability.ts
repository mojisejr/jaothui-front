import type { NextApiRequest, NextApiResponse } from "next";

import { getReviewerSandboxConfig } from "../../../../../server/mobile/reviewer-sandbox";
import { MobileResponse, requireMethod, sendMobileOk } from "../../../../../server/mobile/response";

type ReviewerAvailability = { available: boolean };

/** Exposes only the server gate; credentials and configuration remain secret. */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<ReviewerAvailability>>
) {
  if (!requireMethod(req, res, "GET")) return;
  const config = getReviewerSandboxConfig();
  return sendMobileOk(req, res, {
    available: Boolean(config.enabled && config.username && config.password),
  });
}
