import type { NextApiRequest, NextApiResponse } from "next";

import { createMobileSession } from "../../../../../../server/mobile/auth-session";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../server/mobile/response";
import { verifyMobileOAuthHandoff } from "../../../../../../server/mobile/bitkub-next-auth";

type MobileBitkubNextSession = {
  sessionToken: string;
  expiresAt: number;
  identity: {
    walletAddress: string;
    email: string | null;
    provider: "bitkub-next";
  };
};

function getBodyString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileBitkubNextSession>>
) {
  if (!requireMethod(req, res, "POST")) return;

  const handoff = getBodyString(req.body?.handoff);
  if (!handoff) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing handoff token");
  }

  try {
    const verifiedHandoff = verifyMobileOAuthHandoff(handoff);
    const session = createMobileSession({
      walletAddress: verifiedHandoff.walletAddress,
      email: verifiedHandoff.email,
    });

    return sendMobileOk(req, res, {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      identity: {
        walletAddress: verifiedHandoff.walletAddress,
        email: verifiedHandoff.email,
        provider: "bitkub-next",
      },
    });
  } catch {
    return sendMobileError(
      req,
      res,
      401,
      "UNAUTHORIZED",
      "Invalid or expired handoff token"
    );
  }
}
