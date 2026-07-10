import type { NextApiRequest, NextApiResponse } from "next";

import { createMobileBitkubNextDeepLink } from "../../../../server/mobile/bitkub-next-handoff";

type MobileHandoffResponse =
  | {
      success: true;
      deepLink: string;
    }
  | {
      success: false;
      message: string;
    };

function getBodyString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileHandoffResponse>
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Allow", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Use POST" });
  }

  const code = getBodyString(req.body?.code);
  const state = getBodyString(req.body?.state);

  if (!code || !state) {
    return res
      .status(400)
      .json({ success: false, message: "Missing authorization code or state" });
  }

  try {
    return res.status(200).json({
      success: true,
      deepLink: await createMobileBitkubNextDeepLink({ code, state }),
    });
  } catch (error) {
    console.error(
      "Mobile Bitkub NEXT handoff failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    return res
      .status(400)
      .json({ success: false, message: "Unable to complete mobile authentication" });
  }
}
