import assert from "node:assert/strict";
import { mock } from "bun:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
const h = React.createElement;
const callbacks = new WeakMap();
let metadataAttempt = 0, visible = true, fetches = 0;
let commitImageLoad = false, commitImageWidth = 195;
const committedImages = new WeakSet();
globalThis.fetch = async () => { fetches++; throw new Error("unexpected metadata/provider request"); };
mock.module("next/image", () => ({ default: ({ fill, priority, onLoad, onError, ...props }) => h("img", {
  ...props, loading: priority ? undefined : props.loading || "lazy", ref: (node) => {
    if (!node) return;
    if (!Object.hasOwn(node, "naturalWidth")) Object.defineProperty(node, "naturalWidth", { value: 195, configurable: true });
    callbacks.set(node, { onLoad: () => onLoad({ currentTarget: node }), onError: () => onError({ currentTarget: node }) });
    if (commitImageLoad && !committedImages.has(node)) {
      committedImages.add(node);
      Object.defineProperty(node, "naturalWidth", { value: commitImageWidth, configurable: true });
      Object.defineProperty(node, "complete", { value: true, configurable: true });
      // A warm Next Image can report completion from commit/ref handling before
      // the parent's passive effect activates a new presentation Request.
      onLoad({ currentTarget: node });
    }
  },
}) }));
mock.module(new URL("../components/v2/PhotoRefresh.tsx", import.meta.url).pathname, () => ({
  usePublishedPhoto: (identity, src) => ({ ref: React.useRef(null), visible, identityKey: identity.microchip || identity.photoTokenId,
    imageUrl: src, attempt: metadataAttempt }),
}));
const { BuffaloPhoto } = await import("../components/v2/BuffaloPhoto.tsx");
const { BuffaloCard } = await import("../components/v2/BuffaloCard.tsx");
const { acquirePhotoCandidate } = await import("../utils/photo-candidates.ts");
const realSetTimeout = globalThis.setTimeout, realClearTimeout = globalThis.clearTimeout;
const timers = new Map(); let timerId = 100000;
globalThis.setTimeout = (fn, ms, ...args) => {
  if (ms !== 15000) return realSetTimeout(fn, ms, ...args);
  const id = ++timerId; timers.set(id, () => fn(...args)); return id;
};
globalThis.clearTimeout = (id) => { if (!timers.delete(id)) realClearTimeout(id); };
const timeout = async () => act(async () => { const pending = [...timers.values()]; timers.clear(); pending.forEach((fn) => fn()); });
const photo = (src = "/a.jpg", extra = {}) => h(BuffaloPhoto, { src, alt: "กระบือทดสอบ", microchip: "123", sizes: "200px", ...extra });
const state = (box) => box.querySelector("[data-photo-state]")?.dataset.photoState;
const image = (box) => box.querySelector("img");
const candidate = (box) => box.querySelector('img[aria-hidden="true"]');
const event = async (node, kind = "onLoad", width = kind === "onLoad" ? 195 : 0) => act(async () => {
  Object.defineProperty(node, "naturalWidth", { value: width, configurable: true });
  Object.defineProperty(node, "complete", { value: true, configurable: true });
  callbacks.get(node)[kind]();
});
const retry = async (box) => act(async () => box.querySelector("button[aria-label^='ลองโหลด']").click());
let checks = 0;
async function test(name, run) {
  const box = document.createElement("div"); document.body.append(box);
  const root = createRoot(box);
  const render = async (element) => act(async () => root.render(element));
  try { await run({ box, render }); checks++; console.log(`PASS ${name}`); }
  finally { await act(async () => root.unmount()); box.remove(); metadataAttempt = 0; visible = true; commitImageLoad = false; commitImageWidth = 195; }
  assert.equal(timers.size, 0, `${name}: timers cleaned on unmount`);
}
await test("initial lazy/cache path is not queued, fixed frame and no live spam", async ({ box, render }) => {
  const slots = Array.from({ length: 4 }, () => acquirePhotoCandidate(() => {}));
  await render(photo()); assert.equal(image(box).getAttribute("loading"), "lazy"); assert.equal(state(box), "loading");
  assert.match(box.textContent, /กำลังโหลดภาพ/); assert(!box.querySelector('[role="status"],[aria-live]'));
  assert.match(box.innerHTML, /aspect-\[3\/2\]/); assert.match(box.innerHTML, /h-11/); assert.match(box.innerHTML, /motion-reduce:animate-none/);
  const first = image(box); await event(first); assert.equal(state(box), "ready"); assert.equal(image(box), first);
  await render(photo()); assert.equal(image(box), first); assert.equal(timers.size, 0); slots.forEach((done) => done());
});
await test("missing is distinct and never an endless loader or retry", async ({ box, render }) => {
  await render(photo(null)); assert.equal(state(box), "missing"); assert.match(box.textContent, /ยังไม่มีภาพ/);
  assert(!box.querySelector("button")); assert.equal(timers.size, 0);
  await event(image(box)); assert.equal(state(box), "missing", "fallback logo load is never buffalo success");
});
await test("cached completion during initial commit survives passive activation and StrictMode", async ({ box, render }) => {
  commitImageLoad = true;
  await render(h(React.StrictMode, null, photo())); assert.equal(state(box), "ready");
  assert.equal(image(box).style.opacity, "1"); assert.equal(timers.size, 0);
});
await test("cached same-URI retry completion during commit is accepted before passive activation", async ({ box, render }) => {
  await render(photo()); await event(image(box), "onError"); assert.equal(state(box), "failed");
  commitImageLoad = true; await retry(box); assert.equal(state(box), "ready"); assert.equal(image(box).style.opacity, "1");
  assert.equal(timers.size, 0);
});
await test("broken complete resource during commit stays failed after passive activation", async ({ box, render }) => {
  commitImageLoad = true; commitImageWidth = 0;
  await render(photo()); assert.equal(state(box), "failed"); assert.equal(image(box).style.opacity, "0");
  assert.equal(timers.size, 0);
});
await test("failed initial load retries the exact URI without fetch or navigation", async ({ box, render }) => {
  let opened = 0;
  const card = () => h(BuffaloCard, { name: "ทดสอบ", chip: "123", onClick: () => opened++, image: photo() });
  await render(card()); await event(image(box), "onError"); assert.equal(state(box), "failed");
  assert.match(box.textContent, /โหลดภาพไม่สำเร็จ/); const old = image(box), stale = callbacks.get(old).onLoad;
  const button = box.querySelector("button[aria-label^='ลองโหลด']"); assert(button); assert(!button.closest("button button,a button"));
  await retry(box); assert.equal(opened, 0); assert.notEqual(image(box), old); assert.equal(image(box).getAttribute("src"), "/a.jpg");
  await act(async () => stale()); assert.equal(state(box), "loading");
  await event(image(box)); assert.equal(state(box), "ready");
  await act(async () => box.querySelector("button[aria-label^='ดูรายละเอียด']").click()); assert.equal(opened, 1);
});
await test("metadata replacement retains decoded image and reports external updating", async ({ box, render }) => {
  await render(photo()); await event(image(box)); const good = image(box);
  await render(photo("/b.jpg")); assert.equal(image(box), good); assert.equal(good.getAttribute("src"), "/a.jpg");
  assert.equal(state(box), "updating"); assert.match(box.querySelector("[data-photo-feedback]").textContent, /กำลังอัปเดต/);
  assert(!box.querySelector("[data-photo-state]").textContent.includes("อัปเดต"));
  await event(candidate(box)); assert.equal(image(box).getAttribute("src"), "/b.jpg"); assert.equal(state(box), "ready");
  const b = image(box); metadataAttempt++; await render(photo("/b.jpg")); assert.equal(image(box), b); assert(!candidate(box));
});
await test("failed replacement preserves good pixels, local retry does not remount good", async ({ box, render }) => {
  await render(photo()); await event(image(box)); const good = image(box);
  await render(photo("/b.jpg")); await event(candidate(box), "onError"); assert.equal(state(box), "update-failed"); assert.equal(image(box), good);
  await retry(box); assert.equal(image(box), good); assert.equal(candidate(box).getAttribute("src"), "/b.jpg");
  await event(candidate(box)); assert.equal(image(box).getAttribute("src"), "/b.jpg");
});
await test("displayed responsive bitmap failure is actionable and retries the exact URI", async ({ box, render }) => {
  await render(photo()); await event(image(box)); const displayed = image(box), oldError = callbacks.get(displayed).onError;
  await event(displayed, "onError"); assert.equal(state(box), "failed", "a failed responsive selection is not good pixels");
  assert.equal(image(box).style.opacity, "0"); assert.match(box.textContent, /โหลดภาพไม่สำเร็จ/);
  await retry(box); assert.notEqual(image(box), displayed); assert.equal(image(box).getAttribute("src"), "/a.jpg");
  await event(image(box)); assert.equal(state(box), "ready");
  await act(async () => oldError()); assert.equal(state(box), "ready", "old node's error cannot clear recovered same-URI bitmap");
});
await test("initially captured error handler reports a later failure of the same displayed node", async ({ box, render }) => {
  await render(photo()); const displayed = image(box), initiallyCapturedError = callbacks.get(displayed).onError;
  await event(displayed); assert.equal(state(box), "ready");
  await act(async () => {
    Object.defineProperty(displayed, "naturalWidth", { value: 0, configurable: true });
    initiallyCapturedError();
  });
  assert.equal(state(box), "failed", "a callback captured before good state must still invalidate this same node");
  await retry(box); await event(image(box)); await act(async () => initiallyCapturedError()); assert.equal(state(box), "ready");
});
await test("initially captured synthetic load handler rejects later broken displayed pixels", async ({ box, render }) => {
  await render(photo()); const displayed = image(box), initiallyCapturedLoad = callbacks.get(displayed).onLoad;
  await event(displayed); assert.equal(state(box), "ready");
  await act(async () => {
    Object.defineProperty(displayed, "naturalWidth", { value: 0, configurable: true });
    initiallyCapturedLoad();
  });
  assert.equal(state(box), "failed"); await retry(box); await event(image(box)); assert.equal(state(box), "ready");
});
await test("Next-like complete broken resource synthetic load cannot become initial success", async ({ box, render }) => {
  await render(photo()); const broken = image(box);
  await act(async () => {
    Object.defineProperty(broken, "naturalWidth", { value: 0, configurable: true });
    Object.defineProperty(broken, "complete", { value: true, configurable: true });
    // Next14 handleLoading does decode().catch(()=>{}).then(onLoadRef.current).
    await Promise.reject(new Error("synthetic decode rejection")).catch(() => {}).then(() => callbacks.get(broken).onLoad());
  });
  assert.equal(state(box), "failed"); assert.equal(image(box).style.opacity, "0");
  await retry(box); await event(image(box)); assert.equal(state(box), "ready");
});
await test("Next-like responsive broken synthetic load invalidates displayed pixels", async ({ box, render }) => {
  await render(photo()); await event(image(box)); const oldError = callbacks.get(image(box)).onError;
  await event(image(box), "onLoad", 0); assert.equal(state(box), "failed"); assert.match(box.textContent, /โหลดภาพไม่สำเร็จ/);
  await retry(box); await event(image(box)); await act(async () => oldError()); assert.equal(state(box), "ready");
});
await test("broken candidate synthetic load preserves prior valid pixels", async ({ box, render }) => {
  await render(photo()); await event(image(box)); const good = image(box);
  await render(photo("/b.jpg")); await event(candidate(box), "onLoad", 0);
  assert.equal(state(box), "update-failed"); assert.equal(image(box), good); assert.equal(good.style.opacity, "1");
  await retry(box); await event(candidate(box)); assert.equal(state(box), "ready");
});
await test("late old displayed bitmap error cannot clear a newer source or another identity", async ({ box, render }) => {
  await render(photo()); await event(image(box)); const oldError = callbacks.get(image(box)).onError;
  await render(photo("/b.jpg")); await event(candidate(box)); await act(async () => oldError());
  assert.equal(state(box), "ready"); assert.equal(image(box).getAttribute("src"), "/b.jpg");
  const previousIdentityError = callbacks.get(image(box)).onError;
  await render(photo("/other.jpg", { microchip: "456" })); await event(image(box));
  await act(async () => previousIdentityError()); assert.equal(state(box), "ready"); assert.equal(image(box).getAttribute("src"), "/other.jpg");
});
await test("same-URI metadata attempt retries a broken node but preserves successful nodes", async ({ box, render }) => {
  await render(photo()); await event(image(box)); await event(image(box), "onError"); const broken = image(box);
  metadataAttempt++; await render(photo()); assert.notEqual(image(box), broken); assert.equal(state(box), "loading");
  assert.equal(image(box).getAttribute("src"), "/a.jpg"); await event(image(box)); const good = image(box);
  metadataAttempt++; await render(photo()); assert.equal(image(box), good); assert.equal(state(box), "ready");
});
await test("broken displayed bitmap cancels active replacement and rejects its late callback", async ({ box, render }) => {
  await render(photo()); await event(image(box)); await render(photo("/b.jpg"));
  const late = callbacks.get(candidate(box)).onLoad; await event(image(box), "onError");
  assert.equal(state(box), "failed"); assert.equal(candidate(box), null);
  await act(async () => late()); assert.equal(state(box), "failed");
  await retry(box); assert.equal(image(box).getAttribute("src"), "/b.jpg"); await event(image(box)); assert.equal(state(box), "ready");
});
await test("source generation and identity reset reject late callbacks", async ({ box, render }) => {
  await render(photo()); await event(image(box)); await render(photo("/b.jpg")); const late = callbacks.get(candidate(box));
  await render(photo("/c.jpg")); await act(async () => late.onLoad()); assert.equal(image(box).getAttribute("src"), "/a.jpg");
  await event(candidate(box)); assert.equal(image(box).getAttribute("src"), "/c.jpg");
  const old = callbacks.get(image(box)); await render(photo("/d.jpg", { microchip: "456" }));
  assert.equal(state(box), "loading"); assert.equal(image(box).getAttribute("src"), "/d.jpg"); assert.equal(image(box).style.opacity, "0");
  await act(async () => old.onError()); assert.equal(state(box), "loading"); await event(image(box));
});
await test("visible initial timeout and timeout retry are bounded", async ({ box, render }) => {
  visible = false; await render(photo()); assert.equal(timers.size, 0);
  visible = true; await render(photo()); assert.equal(timers.size, 1); await timeout(); assert.equal(state(box), "failed");
  await event(image(box)); assert.equal(state(box), "failed", "late same-attempt success cannot override timeout");
  await retry(box); await event(image(box)); assert.equal(state(box), "ready");
});
await test("timed-out replacement retries across hidden/visible return without losing its queue slot", async ({ box, render }) => {
  await render(photo()); await event(image(box)); const good = image(box);
  await render(photo("/b.jpg")); await timeout(); assert.equal(state(box), "update-failed");
  visible = false; await render(photo("/b.jpg")); assert.equal(box.querySelector("[data-photo-request]").dataset.photoRequest, "queued");
  assert.equal(candidate(box), null); assert.equal(timers.size, 0);
  visible = true; await render(photo("/b.jpg")); assert(candidate(box)); assert.equal(image(box), good);
  await event(candidate(box), "onError"); await retry(box); assert(candidate(box)); assert.equal(timers.size, 1);
  await event(candidate(box)); assert.equal(state(box), "ready"); assert.equal(image(box).getAttribute("src"), "/b.jpg");
});
await test("four replacement slots release on timeout, late success cannot restore timed-out source", async ({ box, render }) => {
  const gallery = (suffix) => h("div", null, Array.from({ length: 6 }, (_, i) => photo(`/${i}${suffix}.jpg`, { key: i, microchip: String(i) })));
  await render(gallery("a")); for (const img of [...box.querySelectorAll("img")]) await event(img);
  await render(gallery("b")); assert.equal(box.querySelectorAll('img[aria-hidden="true"]').length, 4);
  const late = callbacks.get(candidate(box)).onLoad; await timeout();
  assert.equal(box.querySelectorAll('img[aria-hidden="true"]').length, 2); await act(async () => late());
  assert.equal(image(box).getAttribute("src"), "/0a.jpg");
  await timeout(); assert.equal(box.querySelectorAll('img[aria-hidden="true"]').length, 0);
});
await test("StrictMode remount, unmount and cancelled queue entry release all slots", async ({ box, render }) => {
  const gallery = (suffix) => h(React.StrictMode, null, Array.from({ length: 6 }, (_, i) => photo(`/${i}${suffix}.jpg`, { key: i, microchip: String(i) })));
  await render(gallery("a")); for (const img of [...box.querySelectorAll("img")]) await event(img);
  await render(gallery("b")); assert.equal(box.querySelectorAll('img[aria-hidden="true"]').length, 4);
  const stale = callbacks.get(candidate(box)).onLoad;
  await render(null); await act(async () => stale());
  let started = 0; const slots = Array.from({ length: 4 }, () => acquirePhotoCandidate(() => started++));
  assert.equal(started, 4); slots.forEach((done) => done());
  await render(photo("/new.jpg")); await event(image(box)); assert.equal(state(box), "ready");
});
await test("thumbnail stays square with external accessible retry", async ({ box, render }) => {
  await render(photo("/thumb.jpg", { thumbnail: true, sizes: "56px" })); assert.match(box.innerHTML, /aspect-square/);
  await event(image(box), "onError"); assert.match(box.textContent, /โหลดไม่ได้/); await retry(box); await event(image(box));
});
assert.equal(fetches, 0, "all bitmap actions are local; no metadata/auth/certificate requests");
globalThis.setTimeout = realSetTimeout; globalThis.clearTimeout = realClearTimeout;
dom.window.close(); console.log(`PHOTO_FEEDBACK_MOUNTED_OK ${checks} mounted scenarios; queue, races, timers, retry, unchanged node, identity, StrictMode`);
// Bun keeps React's idle MessageChannel alive after jsdom has closed.
process.exit(0);
