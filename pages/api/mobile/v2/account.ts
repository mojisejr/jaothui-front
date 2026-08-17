import type { NextApiRequest, NextApiResponse } from "next";

import { requireMobileAccountSession } from "../../../../server/mobile/auth-session";
import {
  isInactiveMobileAccountError,
  requireActiveMobileAccountSession,
} from "../../../../server/mobile/account-guard";
import {
  softDeleteAccount,
  AccountNotActiveError,
} from "../../../../server/services/account.service";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../server/mobile/response";

type MobileAccountDeletionReceipt = {
  deletedAt: string;
  deletionPolicyVersion: string;
  manualAppleRevocationRequired: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<MobileAccountDeletionReceipt>>
) {
  if (!requireMethod(req, res, "DELETE")) return;

  try {
    const session = requireMobileAccountSession(req);
    if (!session) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Missing bearer token");
    }

    await requireActiveMobileAccountSession(session);
    const receipt = await softDeleteAccount(session.accountId);

    return sendMobileOk(req, res, {
      deletedAt: receipt.deletedAt.toISOString(),
      deletionPolicyVersion: receipt.deletionPolicyVersion,
      // Without a server-side Apple token/key, deletion is still complete in
      // JAOTHUI. Apple-associated sessions receive truthful manual guidance.
      manualAppleRevocationRequired: session.primaryProvider === "apple",
    });
  } catch (error) {
    if (
      isInactiveMobileAccountError(error) ||
      error instanceof AccountNotActiveError ||
      (error instanceof Error && /session|jwt|token|expired|signature/i.test(error.message))
    ) {
      return sendMobileError(req, res, 401, "UNAUTHORIZED", "Invalid or expired session");
    }

    console.error("Mobile account deletion error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to delete account");
  }
}
