import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://www.jaothui.com/v2/profile" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Chrome" });
Object.defineProperty(window, "isSecureContext", { value: true });
window.matchMedia = () => ({ matches: false });
let permission = "default", prompts = 0, unsubscribes = 0;
const notification = { get permission() { return permission; }, requestPermission: async () => { prompts++; permission = "granted"; return permission; } };
Object.assign(globalThis, { Notification: notification }); window.Notification = notification; window.PushManager = function () {};
const subscription = { toJSON: () => ({ endpoint: "https://fcm.googleapis.com/fcm/send/synthetic", keys: { p256dh: "synthetic", auth: "synthetic" } }), unsubscribe: async () => { unsubscribes++; return true; } };
const registration = { active: { scriptURL: "https://www.jaothui.com/jaothui-push-sw.js" }, pushManager: { getSubscription: async () => subscription, subscribe: async () => subscription } };
Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { getRegistration: async () => registration, register: async () => registration, ready: Promise.resolve(registration) } });
const { createRoot } = await import("react-dom/client");
const { CompetitionNotifications } = await import("../components/v2/CompetitionNotifications.tsx");
const helpers = await import("../utils/web-push.ts");
const intent = await import("../utils/notification-settings-intent.ts");
let calls = [], fetcher;
globalThis.fetch = async (url, options = {}) => { calls.push({ url, ...options }); return fetcher(url, options); };
const ok = data => ({ ok: true, json: async () => ({ ok: true, data }) });
const key = "B".repeat(87);
const flush = fn => act(async () => { fn?.(); await Promise.resolve(); await Promise.resolve(); });
async function mounted(run) {
  localStorage.clear(); sessionStorage.clear(); window.history.replaceState({}, "", "/v2/profile"); calls = []; permission = "default"; prompts = 0;
  const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
  try { await run(host, element => flush(() => root.render(element))); }
  finally { await flush(() => root.unmount()); host.remove(); }
}
const click = (host, text) => flush(() => [...host.querySelectorAll("button")].find(button => button.textContent.includes(text)).click());
await mounted(async (host, render) => {
  window.history.replaceState({}, "", "/v2/profile#competition-notifications");
  fetcher = async () => ok({ available: false, vapidPublicKey: null });
  await render(React.createElement(CompetitionNotifications, { accountKey: "anchor-off" }));
  const section = host.querySelector("#competition-notifications");
  assert(section); assert.equal(document.activeElement, section); assert(host.textContent.includes("ระบบแจ้งเตือนยังไม่เปิดใช้งาน"));
  assert.equal(prompts, 0); assert(!host.textContent.includes("เปิดการแจ้งเตือน"));
});
await mounted(async (host, render) => {
  window.history.replaceState({}, "", "/v2/profile#competition-notifications");
  permission = "denied";
  fetcher = async () => ok({ available: true, vapidPublicKey: key });
  await render(React.createElement(CompetitionNotifications, { accountKey: "anchor-denied" }));
  assert(host.textContent.includes("ถูกบล็อกในการตั้งค่า")); assert.equal(prompts, 0);
  assert(![...host.querySelectorAll("button")].some(button => button.textContent === "เปิดการแจ้งเตือน"));
});
await mounted(async (host, render) => {
  window.history.replaceState({}, "", "/v2/profile#competition-notifications");
  intent.rememberNotificationSettingsIntent(); window.history.replaceState({}, "", "/v2/profile");
  fetcher = async (url) => url.endsWith("/config") ? ok({ available: true, vapidPublicKey: key }) : ok({ enabled: false, bindingGeneration: null });
  await render(React.createElement(CompetitionNotifications, { accountKey: "after-login" }));
  assert.equal(document.activeElement, host.querySelector("#competition-notifications"));
  assert(host.textContent.includes("แจ้งเตือนบนอุปกรณ์นี้")); assert.equal(prompts, 0);
  assert.equal(intent.consumeNotificationSettingsIntent(), false, "login panel intent is one-use");
  window.history.replaceState({}, "", "/v2/profile#competition-notifications"); intent.rememberNotificationSettingsIntent(Date.now() - 11 * 60000); window.history.replaceState({}, "", "/v2/profile");
  assert.equal(intent.consumeNotificationSettingsIntent(), false, "old panel intent expires without opening permission");
});
await mounted(async (host, render) => {
  fetcher = async (url, options) => url.endsWith("/config") ? ok({ available: true, vapidPublicKey: key }) : options.method === "PUT" ? { ok: false, json: async () => ({ ok: false, error: { code: "FAILED" } }) } : ok({ enabled: false, bindingGeneration: null });
  await render(React.createElement(CompetitionNotifications, { accountKey: "A" })); assert.equal(prompts, 0);
  await click(host, "การแจ้งเตือนการแข่งขัน"); assert.equal(host.querySelectorAll("button button").length, 0);
  await click(host, "เปิดการแจ้งเตือน"); assert.equal(prompts, 1);
  assert(host.querySelector('[role="alert"]')); assert(!host.textContent.includes("เปิดแล้ว")); assert.equal(localStorage.getItem("jaothui.push.revocation.v1"), null);
});
await mounted(async (host, render) => {
  fetcher = async (url, options) => url.endsWith("/config") ? ok({ available: true, vapidPublicKey: key }) : options.method === "PUT" ? (window.dispatchEvent(new dom.window.Event("focus")), ok({ enabled: true, bindingGeneration: 1, revocationToken: "success-handle" })) : ok({ enabled: false, bindingGeneration: null });
  await render(React.createElement(CompetitionNotifications, { accountKey: "A" }));
  await click(host, "การแจ้งเตือนการแข่งขัน"); await click(host, "เปิดการแจ้งเตือน");
  assert(host.textContent.includes("เปิดแล้ว")); assert.equal(prompts, 1);
  assert.equal(calls.filter(call => call.url.endsWith("/config")).length, 1, "permission dialog focus must not invalidate an active opt-in");
});
await mounted(async (host, render) => {
  const id = helpers.pushInstallationId(); localStorage.setItem("jaothui.push.revocation.v1", JSON.stringify({ installationId: id, revocationToken: "old-generation", bindingGeneration: 1 }));
  fetcher = async () => ok({ available: false, vapidPublicKey: null });
  await render(React.createElement(CompetitionNotifications, { accountKey: "A" })); await click(host, "การแจ้งเตือนการแข่งขัน");
  assert(host.textContent.includes("พักการเปิดรับชั่วคราว")); assert(!host.textContent.includes("เปิดการแจ้งเตือน"));
  await click(host, "ปิดบนอุปกรณ์นี้"); assert(calls.some(call => call.url === "/api/notifications/revoke")); assert.equal(prompts, 0);
});
localStorage.clear(); permission = "granted"; calls = []; let current = true, resolvePut;
fetcher = async (url, options) => options.method === "PUT" ? new Promise(resolve => { resolvePut = resolve; }) : ok({ enabled: false });
const enabling = helpers.enableWebPush(key, () => current); await new Promise(resolve => setTimeout(resolve, 0));
assert(resolvePut); const id = helpers.pushInstallationId(); const newBinding = JSON.stringify({ installationId: id, revocationToken: "B-secret", bindingGeneration: 2 });
current = false; localStorage.setItem("jaothui.push.revocation.v1", newBinding);
resolvePut(ok({ enabled: true, bindingGeneration: 1, revocationToken: "A-secret" }));
await assert.rejects(enabling, /บัญชีเปลี่ยน/); assert.equal(localStorage.getItem("jaothui.push.revocation.v1"), newBinding);
assert(calls.some(call => call.url === "/api/notifications/revoke" && JSON.parse(call.body).revocationToken === "A-secret"));
localStorage.removeItem("jaothui.push.revocation.v1"); calls = [];
const originalSet = dom.window.Storage.prototype.setItem;
dom.window.Storage.prototype.setItem = function (name, value) { if (name === "jaothui.push.revocation.v1") throw new Error("storage full"); return originalSet.call(this, name, value); };
fetcher = async (url, options) => options.method === "PUT" ? ok({ enabled: true, bindingGeneration: 4, revocationToken: "storage-failure-secret" }) : ok({ enabled: false });
try { await assert.rejects(helpers.enableWebPush(key), /บันทึกการแจ้งเตือนบนอุปกรณ์/); }
finally { dom.window.Storage.prototype.setItem = originalSet; }
assert(calls.some(call => call.url === "/api/notifications/revoke" && JSON.parse(call.body).revocationToken === "storage-failure-secret"));
localStorage.setItem("jaothui.push.revocation.v1", newBinding);
let resolveDelete; current = true; unsubscribes = 0;
fetcher = async () => new Promise(resolve => { resolveDelete = resolve; });
const disabling = helpers.disableWebPush(() => current); await new Promise(resolve => setTimeout(resolve, 0));
current = false; resolveDelete(ok({ enabled: false })); await disabling;
assert.equal(unsubscribes, 0); assert.equal(localStorage.getItem("jaothui.push.revocation.v1"), newBinding);
fetcher = async () => ok({ enabled: true, bindingGeneration: 3 });
assert.equal(await helpers.loadWebPushState(), "idle", "unconfirmed generation cannot look enabled");
console.log("PASS mounted opt-in failure, no automatic prompt/nested buttons, paused opt-out, stale PUT/DELETE and binding-generation checks");
