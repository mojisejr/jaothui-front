import type { NextApiRequest, NextApiResponse } from "next";

import { createMobileLineAccountSession } from "../../../../../../server/mobile/auth-session";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../server/mobile/response";
import { verifyMobileLineOAuthHandoff } from "../../../../../../server/mobile/line-auth";

type MobileLineSession = {
  sessionToken: string;
  expiresAt: number;
  identity: {
    sessionVersion: 2;
    provider: "line";
    accountId: string;
    lineUserId: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    linkedWallet: {
      walletAddress: string;
      provider: "bitkub-next";
      email: string | null;
    } | null;
  };
};

function getBodyString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileLineSession>>
) {
  if (!requireMethod(req, res, "POST")) return;

  const handoff = getBodyString(req.body?.handoff);
  if (!handoff) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing handoff token");
  }

  try {
    const verifiedHandoff = verifyMobileLineOAuthHandoff(handoff);
    const session = createMobileLineAccountSession({
      accountId: verifiedHandoff.accountId,
      lineUserId: verifiedHandoff.lineUserId,
      email: verifiedHandoff.email,
      displayName: verifiedHandoff.displayName,
      avatarUrl: verifiedHandoff.avatarUrl,
      linkedWallet: verifiedHandoff.linkedWallet,
    });

    return sendMobileOk(req, res, {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      identity: {
        sessionVersion: 2,
        provider: "line",
        accountId: verifiedHandoff.accountId,
        lineUserId: verifiedHandoff.lineUserId,
        email: verifiedHandoff.email,
        displayName: verifiedHandoff.displayName,
        avatarUrl: verifiedHandoff.avatarUrl,
        linkedWallet: verifiedHandoff.linkedWallet,
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
