import type { NextApiRequest, NextApiResponse } from "next";

import {
  createMobileAccountSession,
  requireMobileAccountSession,
} from "../../../../../../server/mobile/auth-session";
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
    const code = toMobileAppleAuthErrorCode(error);
    if (
      code === "INVALID_APPLE_IDENTITY_TOKEN" ||
      (error instanceof Error &&
        /session|jwt|token|expired|signature/i.test(error.message))
    ) {
      return sendMobileError(
        req,
        res,
        401,
        "UNAUTHORIZED",
        "Invalid or expired Apple identity token"
      );
    }

    return sendMobileError(
      req,
      res,
      code === "ACCOUNT_IDENTITY_ALREADY_LINKED" ? 409 : 500,
      code === "ACCOUNT_IDENTITY_ALREADY_LINKED" ? "CONFLICT" : "INTERNAL_ERROR",
      code === "ACCOUNT_IDENTITY_ALREADY_LINKED"
        ? "This Apple account is already linked to another JAOTHUI account"
        : "Unable to create Apple account session"
    );
  }
}
