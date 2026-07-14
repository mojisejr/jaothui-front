import type { NextApiRequest, NextApiResponse } from "next";

import {
  createMobileLineAccountSession,
  requireMobileLineAccountSession,
} from "../../../../../../../server/mobile/auth-session";
import {
  createRefreshedLineSessionInput,
  toMobileWalletLinkErrorCode,
} from "../../../../../../../server/mobile/bitkub-next-link";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../../server/mobile/response";

type MobileWalletLinkedSession = {
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
    };
  };
};

function getBodyString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileWalletLinkedSession>>
) {
  if (!requireMethod(req, res, "POST")) return;

  const handoff = getBodyString(req.body?.handoff);
  if (!handoff) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing handoff token");
  }

  try {
    const currentSession = requireMobileLineAccountSession(req);
    if (!currentSession) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    const refreshedInput = createRefreshedLineSessionInput({
      session: currentSession,
      handoff,
    });
    const session = createMobileLineAccountSession(refreshedInput);

    return sendMobileOk(req, res, {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      identity: {
        sessionVersion: 2,
        provider: "line",
        accountId: refreshedInput.accountId,
        lineUserId: refreshedInput.lineUserId,
        email: refreshedInput.email,
        displayName: refreshedInput.displayName,
        avatarUrl: refreshedInput.avatarUrl,
        linkedWallet: refreshedInput.linkedWallet,
      },
    });
  } catch (error) {
    const code = toMobileWalletLinkErrorCode(error);
    if (
      code === "INVALID_WALLET_LINK_HANDOFF" ||
      (error instanceof Error &&
        /session|jwt|token|expired|signature/i.test(error.message))
    ) {
      return sendMobileError(
        req,
        res,
        401,
        "UNAUTHORIZED",
        "Invalid or expired wallet link handoff"
      );
    }

    console.error("Mobile Bitkub NEXT link session error:", error);
    return sendMobileError(
      req,
      res,
      code === "WALLET_ALREADY_LINKED" ? 409 : 500,
      code === "WALLET_ALREADY_LINKED" ? "CONFLICT" : "INTERNAL_ERROR",
      code === "WALLET_ALREADY_LINKED"
        ? "This Bitkub NEXT wallet is already linked to another account"
        : "Unable to complete Bitkub NEXT wallet link"
    );
  }
}
