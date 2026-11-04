import type { NextApiRequest, NextApiResponse } from "next";
import { pushConfig } from "../../../server/notifications/config";
import { pushHeaders } from "../../../server/notifications/http";
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  pushHeaders(res);
  res.setHeader("Vary", "Origin");
  const origin = req.headers.origin;
  if (origin !== undefined && origin !== (process.env.JAOTHUI_FRONT_ORIGIN || "https://www.jaothui.com")) {
    let allowed = false;
    try {
      const configured = process.env.JAOTHUI_EVENT_ORIGIN;
      const event = new URL(configured ?? "");
      allowed = typeof origin === "string" && origin === configured && event.origin === configured && !event.username && !event.password &&
        (event.protocol === "https:" || (process.env.NODE_ENV !== "production" && event.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(event.hostname)));
    } catch { /* Unconfigured/invalid Event origin has no cross-origin access. */ }
    if (!allowed) return res.status(403).json({ ok: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin not allowed" } });
    if (req.method === "GET") {
      res.setHeader("Access-Control-Allow-Origin", origin!);
      res.setHeader("Access-Control-Allow-Methods", "GET");
    }
  }
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
