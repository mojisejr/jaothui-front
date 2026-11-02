import assert from "node:assert/strict";
import { mock } from "bun:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
const h = React.createElement;
mock.module("next/link", () => ({ default: ({ href, children, ...props }) => h("a", { href, ...props }, children) }));
mock.module("next/image", () => ({ default: ({ fill, priority, ...props }) => h("img", props) }));
const { HomeEventZone } = await import("../components/v2/HomeEventZone.tsx");
const { EventList } = await import("../components/v2/EventList.tsx");
const fixture = id => ({ id: String(id), name: `งานประกวดกระบือไทย ${id} ชื่องานยาวเพื่อทดสอบการตัดบรรทัดและการอ่านบนโทรศัพท์`, eventType: "royal", imageUrl: null, competitionStartDay: "2026-11-20", competitionEndDay: "2026-11-21", registrationStartDay: "2026-11-01", registrationDeadline: "2026-11-19", publicRegistration: "open", location: "สนามทดสอบ" });
const page = (items, nextCursor = null, totalOpen = items.length) => ({ items, totalOpen, nextCursor, observedAt: "2026-11-02T12:00:00.000Z" });
const ok = data => ({ ok: true, json: async () => ({ ok: true, data }) });
let fetcher, calls;
globalThis.fetch = (url, options) => { calls.push({ url, ...options }); return fetcher(url, options); };
const intervals = new Map(); let nextTimer = 0;
window.setInterval = (fn, delay) => { assert.equal(delay, 5500); const id = ++nextTimer; intervals.set(id, fn); return id; };
window.clearInterval = id => intervals.delete(id);
const mediaListeners = new Set();
let reduced = false, focused = true, visibility = "visible";
Object.defineProperty(document, "visibilityState", { get: () => visibility });
document.hasFocus = () => focused;
window.matchMedia = () => ({ get matches() { return reduced; }, addEventListener(type, fn) { mediaListeners.add(fn); }, removeEventListener(type, fn) { mediaListeners.delete(fn); } });
const observers = new Set();
globalThis.IntersectionObserver = class { constructor(fn) { this.fn = fn; observers.add(this); } observe() { this.fn([{ isIntersecting: true }]); } disconnect() { observers.delete(this); } };
HTMLElement.prototype.scrollTo = function ({ left }) { this.scrollLeft = left; };
let count = 0;
const flush = async fn => act(async () => { fn?.(); await Promise.resolve(); await Promise.resolve(); });
async function check(name, run) {
  calls = []; fetcher = async () => ok(page([fixture("a"), fixture("b")])); reduced = false; focused = true; visibility = "visible";
  const box = document.createElement("div"); document.body.append(box); const root = createRoot(box);
  const render = element => flush(() => root.render(element));
  try { await run({ box, render }); count++; console.log(`PASS ${name}`); }
  finally { await flush(() => root.unmount()); box.remove(); assert.equal(intervals.size, 0, "timer cleanup"); assert.equal(mediaListeners.size, 0, "motion listener cleanup"); assert.equal(observers.size, 0, "viewport cleanup"); }
}
const click = (box, text) => flush(() => [...box.querySelectorAll("button")].find(button => button.textContent === text)?.click());
function change(input, value) { const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set; setter.call(input, value); input.dispatchEvent(new dom.window.Event("input", { bubbles: true })); input.dispatchEvent(new dom.window.Event("change", { bubbles: true })); }
const submit = box => flush(() => box.querySelector("form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
await check("successful zero hides; one has no autoplay/controls; five/six cap rail", async ({ box, render }) => {
  for (const size of [0, 1, 5, 6]) {
    await render(null); fetcher = async () => ok(page(Array.from({ length: size }, (_, i) => fixture(i)))); await render(h(HomeEventZone));
    assert.equal(box.querySelectorAll("article").length, Math.min(5, size));
    assert.equal(!!box.querySelector('a[href="/v2/events"]'), size > 5);
    if (size < 2) { assert.equal(intervals.size, 0); assert.equal(box.querySelector('button[aria-current="true"]'), null); }
    if (!size) assert.equal(box.innerHTML, "");
    else { assert.equal(box.querySelector("img").className, "object-contain"); assert.equal(box.querySelector('a[aria-label^="สมัครงาน"]').target, ""); assert(box.querySelector("h3").textContent.includes("ชื่องานยาว")); }
  }
});
await check("loading reserves poster; initial failure retry does not masquerade as zero", async ({ box, render }) => {
  let resolve; fetcher = () => new Promise(done => { resolve = done; }); await render(h(HomeEventZone)); assert(box.querySelector('[aria-label="กำลังโหลดงานประกวด"]'));
  await flush(() => resolve({ ok: false })); assert(box.textContent.includes("โหลดงานประกวดไม่สำเร็จ"));
  fetcher = async () => ok(page([])); await click(box, "ลองใหม่"); assert.equal(box.innerHTML, "");
});
await check("autoplay advances5500 and pauses for hidden tab, blur, hover, focus, drag, modal, viewport and reduce motion", async ({ box, render }) => {
  await render(h(HomeEventZone)); assert.equal(intervals.size, 1);
  await flush(() => [...intervals.values()][0]()); assert(box.querySelector('[aria-label^="แสดงงาน 2"]').hasAttribute("aria-current"));
  visibility = "hidden"; await flush(() => document.dispatchEvent(new dom.window.Event("visibilitychange"))); assert.equal(intervals.size, 0);
  visibility = "visible"; await flush(() => document.dispatchEvent(new dom.window.Event("visibilitychange"))); assert.equal(intervals.size, 1);
  focused = false; await flush(() => window.dispatchEvent(new dom.window.Event("blur"))); assert.equal(intervals.size, 0);
  focused = true; await flush(() => window.dispatchEvent(new dom.window.Event("focus"))); assert.equal(intervals.size, 1);
  await flush(() => box.querySelector("section").dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true }))); assert.equal(intervals.size, 0);
  await flush(() => box.querySelector("section").dispatchEvent(new dom.window.MouseEvent("mouseout", { bubbles: true }))); assert.equal(intervals.size, 1);
  await flush(() => box.querySelector("a").focus()); assert.equal(intervals.size, 0);
  await flush(() => box.querySelector("a").blur()); assert.equal(intervals.size, 1);
  const dialog = document.createElement("dialog"); await flush(() => { document.body.append(dialog); dialog.setAttribute("open", ""); }); assert.equal(intervals.size, 0);
  await flush(() => dialog.remove()); assert.equal(intervals.size, 1);
  const modal = document.createElement("div"); await flush(() => { modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); document.body.append(modal); }); assert(document.querySelector('[role="dialog"][aria-modal="true"]')); await flush(); assert.equal(intervals.size, 0);
  await flush(() => modal.remove()); assert.equal(intervals.size, 1);
  await flush(() => [...observers][0].fn([{ isIntersecting: false }])); assert.equal(intervals.size, 0);
  await flush(() => [...observers][0].fn([{ isIntersecting: true }])); assert.equal(intervals.size, 1);
  reduced = true; await flush(() => [...mediaListeners].forEach(fn => fn())); assert.equal(intervals.size, 0);
  reduced = false; await flush(() => [...mediaListeners].forEach(fn => fn())); assert.equal(intervals.size, 1);
  await flush(() => box.querySelector('[aria-roledescription="สไลด์งานประกวด"]').dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }))); assert.equal(intervals.size, 0);
  await flush(() => box.querySelector('[aria-roledescription="สไลด์งานประกวด"]').dispatchEvent(new dom.window.Event("pointerup", { bubbles: true }))); assert.equal(intervals.size, 0, "drag leaves manual pause enabled");
});
await check("unknown/reduced motion never starts timer; dots/manual wheel pause; touch controls44px", async ({ box, render }) => {
  const realMedia = window.matchMedia; window.matchMedia = undefined; await render(h(HomeEventZone)); assert.equal(intervals.size, 0);
  await render(null); window.matchMedia = realMedia; reduced = true; await render(h(HomeEventZone)); assert.equal(intervals.size, 0);
  await render(null); reduced = false; await render(h(HomeEventZone)); assert.equal(intervals.size, 1);
  const dot = box.querySelector('[aria-label^="แสดงงาน 2"]'); assert(dot.className.includes("h-11 w-11")); await flush(() => dot.click());
  assert.equal(intervals.size, 0); assert.equal(dot.getAttribute("aria-current"), "true"); assert(box.querySelector('[aria-pressed="true"]'));
  await click(box, "เล่นสไลด์อัตโนมัติ"); assert.equal(intervals.size, 1);
  await flush(() => box.querySelector('[aria-roledescription="สไลด์งานประกวด"]').dispatchEvent(new dom.window.Event("wheel", { bubbles: true }))); assert.equal(intervals.size, 0);
});
await check("unmount aborts in-flight request and ignores late response", async ({ box, render }) => {
  let resolve; fetcher = () => new Promise(done => { resolve = done; }); await render(h(HomeEventZone)); const signal = calls[0].signal;
  await render(null); assert(signal.aborted); await flush(() => resolve(ok(page([fixture("late")])))); assert.equal(box.innerHTML, "");
});
await check("list submits name/date, invalid reversal prevents fetch; clear resets cursor/filter", async ({ box, render }) => {
  await render(h(EventList));
  const dates = box.querySelectorAll('input[type="date"]');
  await flush(() => { change(dates[0], "2026-11-21"); change(dates[1], "2026-11-20"); }); await submit(box);
  assert(box.querySelector('[role="alert"]')); assert.equal(calls.length, 1);
  await flush(() => change(dates[0], "2026-11-19")); await flush(() => change(box.querySelector('input[type="search"]'), "งานประกวด")); await submit(box);
  const params = new URL(calls.at(-1).url, "http://localhost").searchParams; assert.equal(params.get("q"), "งานประกวด"); assert.equal(params.get("from"), "2026-11-19");
  await click(box, "ล้างตัวกรอง"); assert.equal(box.querySelector('input[type="search"]').value, ""); assert.equal(box.querySelectorAll('input[type="date"]')[0].value, ""); assert(!calls.at(-1).url.includes("cursor="));
});
await check("list pagination dedupes; failure retains cards/cursor and retry appends", async ({ box, render }) => {
  fetcher = async () => ok(page([fixture("a"), fixture("b")], "cursor-2", 4)); await render(h(EventList)); assert.equal(box.querySelectorAll("article").length, 2);
  fetcher = async () => ({ ok: false }); await click(box, "ดูงานเพิ่มเติม"); assert.equal(box.querySelectorAll("article").length, 2); assert(box.textContent.includes("โหลดงานประกวดไม่สำเร็จ")); assert(calls.at(-1).url.includes("cursor=cursor-2"));
  fetcher = async () => ok(page([fixture("b"), fixture("c")], null, 4)); await click(box, "ลองใหม่"); assert.equal(box.querySelectorAll("article").length, 3); assert.equal([...box.querySelectorAll("h3")].filter(node => node.textContent.startsWith("งานประกวดกระบือไทย b ")).length, 1);
});
await check("list query change aborts stale page and ignores out-of-order completion", async ({ box, render }) => {
  fetcher = async () => ok(page([fixture("old")], "old-cursor")); await render(h(EventList));
  let resolve; fetcher = () => new Promise(done => { resolve = done; }); await click(box, "ดูงานเพิ่มเติม"); const staleSignal = calls.at(-1).signal;
  fetcher = async () => ok(page([fixture("new")])); await flush(() => change(box.querySelector('input[type="search"]'), "new")); await submit(box);
  assert(staleSignal.aborted); assert.equal(box.querySelectorAll("article").length, 1); assert(box.querySelector("h3").textContent.includes("new"));
  await flush(() => resolve(ok(page([fixture("stale")])))); assert.equal(box.querySelectorAll("article").length, 1); assert(!box.textContent.includes("stale"));
});
await check("list zero/retry and requests omit credentials", async ({ box, render }) => {
  fetcher = async () => ({ ok: false }); await render(h(EventList)); assert(box.textContent.includes("โหลดงานประกวดไม่สำเร็จ")); assert(!box.textContent.includes("ไม่พบงานประกวด"));
  fetcher = async () => ok(page([])); await click(box, "ลองใหม่"); assert(box.textContent.includes("ไม่พบงานประกวด")); assert(calls.every(call => call.credentials === "omit"));
});
console.log(`WEB_EVENTS_MOUNTED_OK ${count} mounted rail/list cases; browser/provider acceptance remains pending`);
