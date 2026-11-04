import type { NextApiRequest, NextApiResponse } from "next";
import { pushConfig } from "../../../server/notifications/config";
import { pushHeaders } from "../../../server/notifications/http";
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  pushHeaders(res);
  if (req.method !== "GET")
    return res
      .status(405)
      .json({
        ok: false,
        error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
      });
  const { available, vapidPublicKey, expoProjectId } = pushConfig();
  return res.json({
    ok: true,
    data: { available, vapidPublicKey, expoProjectId },
  });
}
