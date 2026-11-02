import type { NextApiRequest, NextApiResponse } from "next";
import { sendMobileAuthFailure } from "../../../../../../server/mobile/auth-failure";

import {
  createMobileAccountSession,
  requireMobileAccountSession,
} from "../../../../../../server/mobile/auth-session";
import {
  requireActiveMobileAccountSession,
} from "../../../../../../server/mobile/account-guard";
import {
  createAppleAccountSessionIdentity,
  toMobileAppleAuthErrorCode,
} from "../../../../../../server/mobile/apple-auth";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../server/mobile/response";

type MobileAppleSession = {
  sessionToken: string;
  expiresAt: number;
  identity: {
    sessionVersion: 2;
    provider: "apple";
    accountId: string;
    providerUserId: string;
    appleUserId: string;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileAppleSession>>
) {
  if (!requireMethod(req, res, "POST")) return;

  const identityToken = getBodyString(req.body?.identityToken);
  if (!identityToken) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing Apple identity token");
  }

  try {
    const currentSession = req.headers.authorization
      ? requireMobileAccountSession(req)
      : null;
    if (currentSession) {
      await requireActiveMobileAccountSession(currentSession);
    }
    const appleIdentity = await createAppleAccountSessionIdentity({
      identityToken,
      email: getBodyString(req.body?.email) ?? null,
      displayName: getBodyString(req.body?.displayName) ?? null,
      avatarUrl: getBodyString(req.body?.avatarUrl) ?? null,
      attachToAccountId: currentSession?.accountId ?? null,
    });

    const session = createMobileAccountSession({
      accountId: appleIdentity.account.id,
      primaryProvider: "apple",
      providerUserId: appleIdentity.providerUserId,
      email: appleIdentity.email,
      displayName: appleIdentity.displayName,
      avatarUrl: appleIdentity.avatarUrl,
      linkedWallet: appleIdentity.linkedWallet,
    });

    return sendMobileOk(req, res, {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      identity: {
        sessionVersion: 2,
        provider: "apple",
        accountId: appleIdentity.account.id,
        providerUserId: appleIdentity.providerUserId,
        appleUserId: appleIdentity.providerUserId,
        email: appleIdentity.email,
        displayName: appleIdentity.displayName,
        avatarUrl: appleIdentity.avatarUrl,
        linkedWallet: appleIdentity.linkedWallet,
      },
    });
  } catch (error) {
    if (toMobileAppleAuthErrorCode(error) === "ACCOUNT_IDENTITY_ALREADY_LINKED") {
      return sendMobileError(req, res, 409, "CONFLICT", "This Apple account is already linked to another JAOTHUI account");
    }
    return sendMobileAuthFailure(req, res, error, {
      flow: "mobile_apple", stage: "session_redeem", failureMessage: "Unable to create Apple account session",
    });
  }
}
