import type { NextApiRequest, NextApiResponse } from "next";
import { sendMobileAuthFailure } from "../../../../../../server/mobile/auth-failure";

import { createMobileLineAccountSession } from "../../../../../../server/mobile/auth-session";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../server/mobile/response";
import { normalizeMobileLineClientFlowId, verifyMobileLineOAuthHandoff } from "../../../../../../server/mobile/line-auth";

type MobileLineSession = {
  clientFlowId?: string;
  sessionToken: string;
  expiresAt: number;
  identity: {
    sessionVersion: 2;
    provider: "line";
    accountId: string;
    providerUserId: string;
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
    const clientFlowId = normalizeMobileLineClientFlowId(req.body?.clientFlowId);
    if (clientFlowId !== verifiedHandoff.clientFlowId) {
      return sendMobileError(req, res, 409, "AUTH_FLOW_MISMATCH", "ขั้นตอนเข้าสู่ระบบไม่ตรงกัน กรุณาเริ่มใหม่");
    }
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
      ...(verifiedHandoff.clientFlowId ? { clientFlowId: verifiedHandoff.clientFlowId } : {}),
      identity: {
        sessionVersion: 2,
        provider: "line",
        accountId: verifiedHandoff.accountId,
        providerUserId: verifiedHandoff.lineUserId,
        lineUserId: verifiedHandoff.lineUserId,
        email: verifiedHandoff.email,
        displayName: verifiedHandoff.displayName,
        avatarUrl: verifiedHandoff.avatarUrl,
        linkedWallet: verifiedHandoff.linkedWallet,
      },
    });
  } catch (error) {
    return sendMobileAuthFailure(req, res, error, {
      flow: "mobile_line", stage: "session_redeem", failureMessage: "Unable to create LINE account session",
    });
  }
}
