import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { webPushCapability } from "../utils/web-push.ts";
import { eventEntryParams, eventEntryIntent } from "../utils/event-entry-intent.ts";

const capability = { userAgent: "Chrome", standalone: false, secure: true, supported: true, permission: "default" };
assert.equal(webPushCapability(capability), "idle");
assert.equal(webPushCapability({ ...capability, permission: "denied" }), "blocked");
assert.equal(webPushCapability({ ...capability, secure: false }), "unsupported");
assert.equal(webPushCapability({ ...capability, userAgent: "iPhone Safari", supported: false }), "install-required");
assert.equal(webPushCapability({ ...capability, userAgent: "iPhone Safari", standalone: true }), "idle");
assert.equal(webPushCapability({ ...capability, userAgent: "Macintosh Mobile/15E Safari", standalone: false }), "install-required");
assert.equal(webPushCapability({ ...capability, userAgent: "iPhone Line/14.0", standalone: true }), "unsupported");
assert.equal(eventEntryIntent(undefined), "registration");
const params = eventEntryParams({ eventId: "event.a", intent: "history", state: "s".repeat(43), code_challenge: "c".repeat(43) });
assert.equal(params.get("intent"), "history");
assert.equal(params.get("eventId"), "event.a");
for (const input of [{ eventId: "drafts.event" }, { eventId: "event", intent: ["history"] }, { eventId: "event", intent: "https://evil.example" }, { eventId: "event", returnTo: "//evil.example" }, { eventId: "event", state: "short" }]) assert.throws(() => eventEntryParams(input));

const listeners = new Map(), shown = [], opened = [], navigated = [];
let windows = [];
const code = readFileSync(new URL("../public/jaothui-push-sw.js", import.meta.url), "utf8");
const context = { module: { exports: {} }, URL, URLSearchParams, Date, self: {
  location: { origin: "https://www.jaothui.com" },
  addEventListener: (name, listener) => listeners.set(name, listener),
  registration: { showNotification: async (...args) => shown.push(args) },
  clients: { matchAll: async () => windows, openWindow: async url => opened.push(url) },
} };
vm.runInNewContext(code, context);
const { reminderPayload, reminderHistoryPath } = context.module.exports;
const payload = { title: "งานทดสอบ", body: "วันที่ 23 พ.ย. 2569", data: { kind: "competition-reminder", eventId: "event.a", expiresAt: "2099-11-23T00:00:00Z", reminderId: "slot-1", url: "https://evil.example" } };
assert(reminderPayload(payload));
for (const invalid of [{ ...payload, data: { ...payload.data, expiresAt: "2020-01-01" } }, { ...payload, data: { ...payload.data, eventId: "../escape" } }, { ...payload, data: { ...payload.data, kind: "other" } }, { ...payload, data: { ...payload.data, expiresAt: "invalid" } }, {}]) assert.equal(reminderPayload(invalid), null);
assert.equal(reminderHistoryPath("event.a"), "/v2/event-entry?eventId=event.a&intent=history");
assert.equal(reminderHistoryPath("../escape"), null);
assert(!listeners.has("fetch"), "push-only worker must not intercept navigation or cache pages");
let pending;
listeners.get("push")({ data: { json: () => payload }, waitUntil: promise => { pending = promise; } });
await pending;
assert.equal(shown.length, 1); assert.equal(shown[0][1].data.eventId, "event.a"); assert(!("url" in shown[0][1].data));
listeners.get("push")({ data: { json: () => { throw new Error("malformed"); } }, waitUntil: () => assert.fail("malformed payload cannot notify") });
let closed = 0;
const click = async eventId => { listeners.get("notificationclick")({ notification: { close: () => closed++, data: { eventId, url: "https://evil.example" } }, waitUntil: promise => { pending = promise; } }); await pending; };
await click("event.a");
assert.equal(opened[0], "https://www.jaothui.com/v2/event-entry?eventId=event.a&intent=history");
windows = [{ url: "https://evil.example", navigate: () => assert.fail("cross-origin client") }, { url: "https://www.jaothui.com/v2", navigate: async url => { navigated.push(url); return { focus: async () => {} }; } }];
await click("event.a"); assert.equal(navigated.length, 1); assert.equal(opened.length, 1);
assert.equal(closed, 2);
console.log("PASS web push capability, fixed history intent, expiration, worker payload/click and no cache interception");
