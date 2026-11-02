import type { NextApiRequest, NextApiResponse } from "next";
import { MobileEventService } from "../mobile/events/service";
import { createEventClient } from "../mobile/events/config";
import { EventError } from "../mobile/events/errors";

/** Same public DTO and open-registration policy as the mobile discovery route. */
export function createWebEventsHandler(
  list: MobileEventService["list"] = input => new MobileEventService(createEventClient()).list(input),
  enabled: () => boolean = () => process.env.JAOTHUI_EVENT_SSO_ENABLED === "true",
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
    }
    if (!enabled()) return res.status(503).json({ ok: false, error: { code: "EVENTS_UNAVAILABLE" } });
    try {
      if (Object.keys(req.query).some(key => !["q", "from", "to", "cursor", "limit"].includes(key))) throw new EventError(422, "INVALID_FIELDS", "กรุณาตรวจสอบตัวกรอง");
      const value = (key: string) => {
        const result = req.query[key];
        if (result !== undefined && typeof result !== "string") throw new EventError(422, "INVALID_FIELDS", "กรุณาตรวจสอบตัวกรอง");
        return result;
      };
      const data = await list({ q: value("q"), from: value("from"), to: value("to"), cursor: value("cursor"), ...(value("limit") ? { limit: Number(value("limit")) } : {}) });
      // This handler never resolves an actor, reads cookies, or emits Set-Cookie.
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      return res.status(error instanceof EventError ? error.status : 503).json({ ok: false, error: { code: error instanceof EventError ? error.code : "EVENTS_UNAVAILABLE" } });
    }
  };
}
