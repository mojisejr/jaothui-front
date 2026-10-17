import type { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import { classifyAuthFailure, logAuthStage } from "../../../../server/auth/diagnostics";
import { getAuthRequestId } from "../../../../server/auth/request-id";

import { getLineWebSessionFromRequest } from "../../../../server/auth/line-web-session";
import {
  linkBitkubNextWalletToLineAccount,
  toWalletLinkErrorResponse,
} from "../../../../server/auth/line-web-wallet-link";
import type { LineWebAccountResponse } from "../../../../server/auth/line-web-account";

type LinkBitkubNextResponse =
  | {
      success: true;
      account: LineWebAccountResponse;
    }
  | {
      success: false;
      code?: string;
      message: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LinkBitkubNextResponse>
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Allow", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Use POST" });
  }

  let session;
  try {
    session = getLineWebSessionFromRequest({ req, res });
  } catch (error) {
    const failure = classifyAuthFailure(error);
    logAuthStage({ requestId: getAuthRequestId(req), flow: "web_line", stage: "wallet_link", outcome: "failed", error });
    return res
      .status(failure.status)
      .json({ success: false, code: failure.status === 401 ? "LINE_SESSION_INVALID" : "LINE_SESSION_UNAVAILABLE", message: failure.status === 401 ? "Invalid LINE session" : "Unable to verify LINE session. Please try again." });
  }

  if (!session) {
    return res
      .status(401)
      .json({ success: false, code: "LINE_SESSION_MISSING", message: "No LINE session" });
  }

  const accessToken = getCookie("access_token", { req, res });
  if (typeof accessToken !== "string" || !accessToken.trim()) {
    return res
      .status(401)
      .json({ success: false, code: "BITKUB_NEXT_AUTH_MISSING", message: "No Bitkub NEXT session" });
  }

  try {
    const account = await linkBitkubNextWalletToLineAccount({
      session,
      accessToken,
    });

    return res.status(200).json({ success: true, account });
  } catch (error) {
    const response = toWalletLinkErrorResponse(error);
    return res.status(response.status).json(response.body);
  }
}
