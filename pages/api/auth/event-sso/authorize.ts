import type { NextApiRequest, NextApiResponse } from "next";
import { recordEventSsoFailure } from "../../../../server/auth/event-sso-diagnostics";
import { authorizeGrant, EventSsoError, noStore, ssoConfig, validEventId } from "../../../../server/auth/event-sso";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  try {
    ssoConfig();
    if (req.method !== "GET") throw new EventSsoError(405, "METHOD_NOT_ALLOWED");
    const eventId = validEventId(req.query.eventId);
    const state = req.query.state; const challenge = req.query.code_challenge;
    if (typeof state !== "string" || !/^[A-Za-z0-9_-]{32,128}$/.test(state) || typeof challenge !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(challenge) || req.query.code_challenge_method !== "S256" || Object.keys(req.query).some(k => !["eventId", "state", "code_challenge", "code_challenge_method"].includes(k))) throw new EventSsoError(400, "INVALID_AUTHORIZATION_REQUEST");
    try { return res.redirect(302, await authorizeGrant({ req, res }, { eventId, state, challenge })); }
    catch (error) {
      if (error instanceof EventSsoError && ["LOGIN_REQUIRED", "LINE_LINK_REQUIRED", "BROWSER_SESSION_INVALID"].includes(error.code)) {
        recordEventSsoFailure({ req, res }, "authorize", error, true);
        return res.redirect(302, `/v2/event-entry?${new URLSearchParams({ eventId, state, code_challenge: challenge })}`);
      }
      throw error;
    }
  } catch (error) { const { failure } = recordEventSsoFailure({ req, res }, "authorize", error); return res.status(failure.status).json({ ok: false, error: { code: failure.code } }); }
}
