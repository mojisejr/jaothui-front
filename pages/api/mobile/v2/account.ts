import type { NextApiRequest, NextApiResponse } from "next";
import { sendMobileAuthFailure } from "../../../../server/mobile/auth-failure";

import { requireMobileAccountSession } from "../../../../server/mobile/auth-session";
import {
  requireActiveMobileAccountSession,
} from "../../../../server/mobile/account-guard";
import {
  softDeleteAccount,
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
    return sendMobileAuthFailure(req, res, error, {
      flow: "mobile_account", stage: "account_delete", failureMessage: "Unable to delete account",
    });
  }
}
