import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { recordEventSsoFailure } from "./event-sso-diagnostics";
import { EventSsoError, exchangeGrant, introspectSession, noStore, requireClient, revokeEventSession } from "./event-sso";
const tokenBody = z.object({ sessionToken: z.string().max(128) }).strict();
const exchangeBody = z.object({ code: z.string().max(128), codeVerifier: z.string().max(128), redirectUri: z.string().max(512) }).strict();
export function eventSsoHandler(action: "exchange" | "introspect" | "revoke") {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    noStore(res);
    try {
      if (req.method !== "POST") throw new EventSsoError(405, "METHOD_NOT_ALLOWED");
      requireClient(req);
      if (req.headers["content-type"]?.split(";")[0] !== "application/json") throw new EventSsoError(400, "INVALID_JSON");
      if (action === "exchange") {
        const parsed = exchangeBody.safeParse(req.body);
        if (!parsed.success) throw new EventSsoError(400, "INVALID_FIELDS");
        return res.status(200).json({ ok: true, data: await exchangeGrant(parsed.data) });
      }
      const parsed = tokenBody.safeParse(req.body);
      if (!parsed.success) throw new EventSsoError(400, "INVALID_FIELDS");
      if (action === "revoke") { await revokeEventSession(parsed.data.sessionToken); return res.status(200).json({ ok: true, data: { revoked: true } }); }
      return res.status(200).json({ ok: true, data: await introspectSession(parsed.data.sessionToken) });
    } catch (error) {
      const { failure } = recordEventSsoFailure({ req, res }, action, error); return res.status(failure.status).json({ ok: false, error: { code: failure.code } });
    }
  };
}
