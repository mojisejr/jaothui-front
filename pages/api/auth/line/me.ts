import type { NextApiRequest, NextApiResponse } from "next";

import { getLineWebSessionFromRequest } from "../../../../server/auth/line-web-session";

type LineMeResponse =
  | {
      success: true;
      account: {
        accountId: string;
        provider: "line";
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
    }
  | {
      success: false;
      message: string;
    };

export default function handler(
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

    return res.status(200).json({
      success: true,
      account: {
        accountId: session.accountId,
        provider: "line",
        lineUserId: session.lineUserId,
        email: session.email,
        displayName: session.displayName,
        avatarUrl: session.avatarUrl,
        linkedWallet: session.linkedWallet,
      },
    });
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid LINE session" });
  }
}
