import type { NextApiRequest, NextApiResponse } from "next";

import {
  createMobileAccountSession,
  requireMobileCustomerAccountSession,
} from "../../../../../../../server/mobile/auth-session";
import {
  isInactiveMobileAccountError,
  requireActiveMobileAccountSession,
} from "../../../../../../../server/mobile/account-guard";
import {
  createRefreshedAccountSessionInput,
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
    provider: "line" | "apple";
    accountId: string;
    providerUserId: string;
    lineUserId?: string;
    appleUserId?: string;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileWalletLinkedSession>>
) {
  if (!requireMethod(req, res, "POST")) return;

  const handoff = getBodyString(req.body?.handoff);
  if (!handoff) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing handoff token");
  }

  try {
    const currentSession = requireMobileCustomerAccountSession(req);
    if (!currentSession) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    await requireActiveMobileAccountSession(currentSession);

    const refreshedInput = createRefreshedAccountSessionInput({
      session: currentSession,
      handoff,
    });
    const session = createMobileAccountSession(refreshedInput);

    return sendMobileOk(req, res, {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      identity: {
        sessionVersion: 2,
        provider: refreshedInput.primaryProvider,
        accountId: refreshedInput.accountId,
        providerUserId: refreshedInput.providerUserId,
        ...(refreshedInput.primaryProvider === "line"
          ? { lineUserId: refreshedInput.providerUserId }
          : {}),
        ...(refreshedInput.primaryProvider === "apple"
          ? { appleUserId: refreshedInput.providerUserId }
          : {}),
        email: refreshedInput.email,
        displayName: refreshedInput.displayName,
        avatarUrl: refreshedInput.avatarUrl,
        linkedWallet: refreshedInput.linkedWallet,
      },
    });
  } catch (error) {
    const code = toMobileWalletLinkErrorCode(error);
    if (
      isInactiveMobileAccountError(error) ||
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
