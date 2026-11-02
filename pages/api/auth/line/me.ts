import type { NextApiRequest, NextApiResponse } from "next";
import { classifyAuthFailure, logAuthStage } from "../../../../server/auth/diagnostics";
import { getAuthRequestId } from "../../../../server/auth/request-id";

import { getLineWebSessionFromRequest } from "../../../../server/auth/line-web-session";
import {
  getFreshLineWebAccount,
  type LineWebAccountResponse,
} from "../../../../server/auth/line-web-account";

type LineMeResponse =
  | {
      success: true;
      account: LineWebAccountResponse;
    }
  | {
      success: false;
      message: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LineMeResponse>
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Allow", "GET");

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Use GET" });
  }

  try {
    const session = getLineWebSessionFromRequest({ req, res });
    if (!session) {
      return res.status(401).json({ success: false, message: "No LINE session" });
    }

    const account = await getFreshLineWebAccount(session);
    if (!account) {
      return res.status(401).json({ success: false, message: "Invalid LINE session" });
    }

    return res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    const failure = classifyAuthFailure(error);
    logAuthStage({ requestId: getAuthRequestId(req), flow: "web_line", stage: "profile_read", outcome: "failed", error });
    return res
      .status(failure.status)
      .json({ success: false, message: failure.status === 401 ? "Invalid LINE session" : "Unable to load LINE account. Please try again." });
  }
}
