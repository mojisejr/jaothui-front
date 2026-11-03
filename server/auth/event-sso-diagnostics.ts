import { classifyAuthFailure } from "./diagnostics";
import { getAuthRequestId } from "./request-id";
import { EventSsoError, ssoFailure, type CookieContext } from "./event-sso";

const STAGES = new Set(["entry_configuration", "entry_intent", "entry_principal", "entry_identity", "line_attach", "authorize", "exchange", "introspect", "revoke", "handoff"]);
const CODES = new Set(["SSO_DISABLED", "IDENTITY_MAPPING_UNVERIFIED", "SSO_CONFIGURATION_UNAVAILABLE", "SSO_UNAVAILABLE", "METHOD_NOT_ALLOWED", "INVALID_JSON", "INVALID_FIELDS", "CSRF_REJECTED", "INVALID_CLIENT", "INVALID_EVENT", "ACCOUNT_INACTIVE", "REVIEWER_APPLICANT_FORBIDDEN", "LINE_IDENTITY_AMBIGUOUS", "LINE_IDENTITY_CHANGED", "WALLET_ACCOUNT_UNVERIFIED", "ACCOUNT_SELECTION_REQUIRED", "LOGIN_REQUIRED", "BROWSER_SESSION_INVALID", "INVALID_AUTHORIZATION_REQUEST", "LINE_LINK_REQUIRED", "SESSION_REVOKED", "WALLET_IDENTITY_CHANGED", "INVALID_CREDENTIAL_BINDING", "INVALID_EXCHANGE", "INVALID_GRANT", "INVALID_SESSION", "INVALID_AUTH", "INVALID_RETURN_INTENT", "LINE_ALREADY_LINKED", "INVALID_ATTACH_STATE", "ATTACH_ALREADY_USED", "LINE_IDENTITY_ALREADY_LINKED", "SESSION_UNAVAILABLE"]);
const VARIABLES = ["JAOTHUI_FRONT_ORIGIN", "JAOTHUI_EVENT_ORIGIN", "JAOTHUI_EVENT_SSO_CLIENT_SECRET", "JAOTHUI_EVENT_SSO_STATE_SECRET", "JAOTHUI_LINE_LOGIN_CHANNEL_ID"];
const STATUSES = new Set([400, 401, 403, 404, 405, 409, 503]);

/** One bounded receipt per failed/resumed boundary; never serialize the request/error. */
export function recordEventSsoFailure(ctx: CookieContext, stage: string, error: unknown, resume = false) {
  const requestId = getAuthRequestId(ctx.req);
  ctx.res.setHeader("X-Request-Id", requestId);
  const original = ssoFailure(error);
  const known = CODES.has(original.code) && STATUSES.has(original.status);
  const failure = known ? original : new EventSsoError(503, "SSO_UNAVAILABLE");
  const configuration = failure.code === "SSO_CONFIGURATION_UNAVAILABLE" || failure.code === "IDENTITY_MAPPING_UNVERIFIED";
  const missingVariables = configuration ? VARIABLES.filter(name => failure.missingVariables?.includes(name)) : [];
  const receipt = {
    requestId, flow: "web_event_sso", stage: STAGES.has(stage) ? stage : "handoff",
    outcome: resume ? "resume" : "failed", code: failure.code, status: failure.status,
    category: configuration ? "configuration" : failure.status === 401 ? "invalid_auth" : classifyAuthFailure(error).category,
    ...(missingVariables.length ? { missingVariables } : {}),
  };
  if (resume || failure.code === "SSO_DISABLED") console.info("JAOTHUI Event SSO", receipt);
  else console.warn("JAOTHUI Event SSO", receipt);
  return { failure, requestId };
}
