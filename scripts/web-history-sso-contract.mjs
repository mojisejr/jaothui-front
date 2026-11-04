import assert from "node:assert/strict";
import { mock } from "bun:test";
let principal = "linked", granted = [], attached;
class EventSsoError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
const config = { eventOrigin: "https://event.example" };
mock.module("../server/auth/event-sso.ts", () => ({
  EventSsoError, noStore: res => res.setHeader("Cache-Control", "no-store"),
  validEventId: value => { if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(value)) throw new EventSsoError(400, "INVALID_EVENT"); return value; },
  ssoConfig: () => { if (process.env.JAOTHUI_EVENT_SSO_ENABLED !== "true") throw new EventSsoError(404, "SSO_DISABLED"); return config; },
  activeBrowser: async () => { if (principal === "login") throw new EventSsoError(401, "LOGIN_REQUIRED"); return { accountId: "current" }; },
  freshAccount: async () => ({ lineId: principal === "unlinked" ? null : "line-current" }),
  authorizeGrant: async (ctx, value) => { granted.push(value); if (principal === "login") throw new EventSsoError(401, "LOGIN_REQUIRED"); return "https://event.example/api/auth/front/callback?code=fixture"; },
}));
mock.module("../server/auth/event-sso-line-attach.ts", () => ({ beginLineAttach: async (ctx, returnTo) => { attached = returnTo; return "https://access.line.example"; } }));
mock.module("../server/auth/event-sso-diagnostics.ts", () => ({ recordEventSsoFailure: (ctx, stage, error) => ({ failure: error, requestId: "synthetic" }) }));
const { getServerSideProps } = await import("../pages/v2/event-entry.tsx");
const authorize = (await import("../pages/api/auth/event-sso/authorize.ts")).default;
const response = () => ({ setHeader() {}, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; }, redirect(status, value) { this.redirectTo = value; this.statusCode = status; return this; } });
const entry = query => getServerSideProps({ req: { headers: {} }, res: response(), query });
process.env.JAOTHUI_EVENT_SSO_ENABLED = "true";
process.env.JAOTHUI_EVENT_ORIGIN = "https://event.example";
let result = await entry({ eventId: "signup-closed", intent: "history" });
assert.equal(result.redirect.destination, "https://event.example/api/auth/front/start?eventId=signup-closed&intent=history");
result = await entry({ eventId: "event.a" }); assert.equal(result.redirect.destination, "https://event.example/api/auth/front/start?eventId=event.a");
principal = "login";
result = await entry({ eventId: "event.a", intent: "history" });
assert.equal(result.props.history, true); assert(result.props.message.includes("ดูใบสมัคร"));
assert.equal(new URL(result.props.loginTo, "https://front.example").searchParams.get("returnTo"), "/v2/event-entry?eventId=event.a&intent=history");
principal = "unlinked";
result = await entry({ eventId: "event.a", intent: "history", attach: "line" }); assert(attached.includes("intent=history"));
principal = "linked";
result = await entry({ eventId: "event.a", intent: "history", state: "s".repeat(43), code_challenge: "c".repeat(43) });
assert(result.redirect.destination.includes("intent=history")); assert(result.redirect.destination.includes("code_challenge_method=S256"));
principal = "login";
const res = response(); await authorize({ method: "GET", headers: {}, query: { eventId: "event.a", intent: "history", state: "s".repeat(43), code_challenge: "c".repeat(43), code_challenge_method: "S256" } }, res);
assert(res.redirectTo.includes("intent=history"));
const bad = response(); await authorize({ method: "GET", headers: {}, query: { eventId: "event.a", intent: "https://evil.example", state: "s".repeat(43), code_challenge: "c".repeat(43), code_challenge_method: "S256" } }, bad); assert.equal(bad.statusCode, 400);
process.env.JAOTHUI_EVENT_SSO_ENABLED = "false";
result = await entry({ eventId: "event.a", intent: "history" }); assert.equal(result.redirect.destination, "https://event.example/profile/my-events?eventId=event.a");
result = await entry({ eventId: "event.a" }); assert.equal(result.props.message, "ยังไม่เปิดใช้การสมัครจากเว็บไซต์");
console.log("PASS actual history entry/authorize handlers preserve fixed intent through login, attach, retry and flag-off history without signup gate");
