import assert from "node:assert/strict";
import { mock } from "bun:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";

// Real Next14 Image is deliberately NOT mocked. jsdom cannot select srcset or
// fetch/decode image bytes, so selected-resource terminal state is controlled
// below, including the observed path which emits NO load/error at all.
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost", pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
let visible = true, fetches = 0;
globalThis.fetch = async () => { fetches++; throw new Error("unexpected metadata/auth request"); };
mock.module(new URL("../components/v2/PhotoRefresh.tsx", import.meta.url).pathname, () => ({
  usePublishedPhoto: (identity, src) => ({ ref: React.useRef(null), visible, identityKey: identity.microchip, imageUrl: src, attempt: 0 }),
}));
if (process.argv.includes("--baseline-without-guard")) {
  mock.module(new URL("../utils/observe-responsive-photo.ts", import.meta.url).pathname, () => ({ observeResponsivePhoto: () => () => {} }));
}
const { BuffaloPhoto } = await import("../components/v2/BuffaloPhoto.tsx");
const { BuffaloCard } = await import("../components/v2/BuffaloCard.tsx");
const h = React.createElement;
const frames = new Map(), checkpoints = new Map();
let frameId = 0, timerId = 100000;
const realTimeout = globalThis.setTimeout, realClearTimeout = globalThis.clearTimeout;
window.requestAnimationFrame = (fn) => { const id = ++frameId; frames.set(id, fn); return id; };
window.cancelAnimationFrame = (id) => frames.delete(id);
globalThis.setTimeout = (fn, delay, ...args) => {
  if (![100,500,1500,15000].includes(delay)) return realTimeout(fn, delay, ...args);
  const id = ++timerId; checkpoints.set(id, { delay, run: () => fn(...args) }); return id;
};
globalThis.clearTimeout = (id) => { if (!checkpoints.delete(id)) realClearTimeout(id); };
const resize = async () => act(async () => window.dispatchEvent(new window.Event("resize")));
const frame = async () => act(async () => { const pending=[...frames.values()]; frames.clear(); pending.forEach((fn) => fn(0)); });
const checkpoint = async (delay) => act(async () => {
  for (const [id, timer] of [...checkpoints]) if (timer.delay === delay) { checkpoints.delete(id); timer.run(); }
});
const selected = (img, { width = 187, complete = true, candidate = 256 } = {}) => {
  for (const [key, value] of Object.entries({ naturalWidth: width, complete,
    currentSrc: `http://localhost/_next/image?url=%2Fa.jpg&w=${candidate}&q=75` })) Object.defineProperty(img, key, { configurable: true, value });
};
const state = (box) => box.querySelector("[data-photo-state]")?.dataset.photoState;
const image = (box) => box.querySelector("img");
const load = async (img, options) => { selected(img, options); await act(async () => img.dispatchEvent(new window.Event("load"))); };
const photo = (src = "/a.jpg", extra = {}) => h(BuffaloPhoto, { src, alt: "กระบือทดสอบ", microchip: "123", sizes: "200px", ...extra });
const deferred = () => { let resolve, reject; const promise=new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
let checks=0;
async function test(name, run) {
  const box=document.createElement("div"); document.body.append(box); const root=createRoot(box);
  const render=async(element)=>act(async()=>root.render(element));
  try { await run({box,render}); checks++; console.log(`PASS ${name}`); }
  finally { await act(async()=>root.unmount()); box.remove(); visible=true; }
  assert.equal(frames.size,0,`${name}: resize frames cleaned`);
  assert.equal(checkpoints.size,0,`${name}: all deadlines/checkpoints cleaned`);
}
await test("real Next Image silently broken responsive candidate leaves ready only without the guard", async({box,render})=>{
  let opened=0, events=0;
  await render(h(BuffaloCard,{name:"ทดสอบ",chip:"123",onClick:()=>opened++,image:photo()}));
  await load(image(box)); const good=image(box), originalSrc=good.getAttribute("src"), originalSet=good.getAttribute("srcset");
  assert.equal(state(box),"ready"); assert(good.getAttribute("srcset"),"actual optimized Next Image rendered");
  good.addEventListener("load",()=>events++); good.addEventListener("error",()=>events++);
  await resize(); await frame(); // browser can still report old healthy256 here
  selected(good,{width:0,candidate:640}); await checkpoint(100); // NO load/error dispatched
  assert.equal(events,0); assert.equal(state(box),"failed");
  assert.match(box.textContent,/โหลดภาพไม่สำเร็จ/); assert.equal(good.style.opacity,"0");
  await act(async()=>box.querySelector("button[aria-label^='ลองโหลด']").click());
  assert.equal(opened,0); assert.notEqual(image(box),good); assert.equal(image(box).getAttribute("src"),originalSrc);
  assert.equal(image(box).getAttribute("srcset"),originalSet); await load(image(box),{width:400,candidate:640});
  assert.equal(state(box),"ready"); assert.equal(fetches,0);
});
await test("healthy responsive selection keeps the same real Next node/source/cache attributes", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box), src=good.getAttribute("src"), srcset=good.getAttribute("srcset");
  let decoded=0; good.decode=()=>{decoded++;return Promise.resolve();};
  selected(good,{width:400,candidate:640}); await resize(); await frame();
  for(const delay of[100,500,1500])await checkpoint(delay);
  assert.equal(state(box),"ready"); assert.equal(image(box),good); assert.equal(good.getAttribute("src"),src); assert.equal(good.getAttribute("srcset"),srcset);
  assert.equal(decoded,4); assert.equal(checkpoints.size,0,"bounded checks end instead of idle polling");
  await render(photo()); assert.equal(image(box),good); assert.equal(decoded,4,"unchanged metadata does not restart idle work");
});
await test("slow selected resource stays ready while inflight and decode rejection reports terminal failure", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box), pending=deferred();
  good.decode=()=>pending.promise; selected(good,{width:0,complete:false,candidate:640});
  await resize(); await frame(); for(const delay of[100,500,1500])await checkpoint(delay);
  assert.equal(state(box),"ready"); assert.equal(checkpoints.size,0);
  selected(good,{width:0,complete:true,candidate:640});
  await act(async()=>pending.reject(new Error("selected640 decode failure")));
  assert.equal(state(box),"failed");
});
await test("empty currentSrc during a long pending selection accepts its later terminal selected URL", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box), pending=deferred();
  good.decode=()=>pending.promise; selected(good,{width:0,complete:false,candidate:640});
  Object.defineProperty(good,"currentSrc",{configurable:true,value:""});
  await resize(); await frame(); for(const delay of[100,500,1500])await checkpoint(delay);
  assert.equal(state(box),"ready"); assert.equal(checkpoints.size,0,"pending work no longer relies on checkpoint polling");
  selected(good,{width:0,complete:true,candidate:640});
  await act(async()=>pending.reject(new Error("long pending640 terminal failure without events")));
  assert.equal(state(box),"failed");
});
await test("rapid resize invalidates older decode settlements before a newer selection settles", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box), old=deferred();
  good.decode=()=>old.promise; selected(good,{width:0,complete:false,candidate:640}); await resize(); await frame();
  await resize(); selected(good,{width:0,complete:true,candidate:1080});
  await act(async()=>old.reject(new Error("aborted older selection"))); assert.equal(state(box),"ready","old generation cannot fail new resource");
  selected(good,{width:700,candidate:1080}); good.decode=()=>Promise.resolve(); await frame();
  for(const delay of[100,500,1500])await checkpoint(delay); assert.equal(state(box),"ready"); assert.equal(image(box),good);
});
await test("a decode settlement cannot classify a different currentSrc within the same resize generation", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box), old=deferred();
  good.decode=()=>old.promise; selected(good,{width:0,complete:false,candidate:640}); await resize(); await frame();
  selected(good,{width:0,complete:true,candidate:1080});
  await act(async()=>old.reject(new Error("superseded selected resource")));
  assert.equal(state(box),"ready","640 decode outcome cannot classify a newer1080 selection");
  await checkpoint(100); assert.equal(state(box),"failed","the next bounded check classifies the actual current1080 bitmap");
});
await test("engines without decode still detect silently broken cached selection using bounded checkpoints", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box); good.decode=undefined;
  await resize(); await frame(); selected(good,{width:0,candidate:640}); await checkpoint(500);
  assert.equal(state(box),"failed"); assert.equal(checkpoints.size,0);
});
await test("hidden photos do no resize work and validate a broken node when visible again", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box);
  visible=false; await render(photo()); await resize(); assert.equal(frames.size,0); assert.equal(checkpoints.size,0);
  selected(good,{width:0,candidate:640}); visible=true; await render(photo()); await frame(); assert.equal(state(box),"failed");
});
await test("visibility return awaits an empty-currentSrc pending resource before classifying its late failure", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box), pending=deferred();
  visible=false; await render(photo()); selected(good,{width:0,complete:false,candidate:640});
  Object.defineProperty(good,"currentSrc",{configurable:true,value:""}); good.decode=()=>pending.promise;
  visible=true; await render(photo()); await frame(); for(const delay of[100,500,1500])await checkpoint(delay);
  assert.equal(state(box),"ready","pending pixels are not misclassified as failure");
  selected(good,{width:0,complete:true,candidate:640}); await act(async()=>pending.reject(new Error("late failure after visibility return")));
  assert.equal(state(box),"failed");
});
await test("unmount cancels all bounded work and ignores pending decode without callbacks", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box), old=deferred(); good.decode=()=>old.promise;
  selected(good,{width:0,complete:false,candidate:640}); await resize(); await frame(); await render(null);
  selected(good,{width:0,candidate:640}); await act(async()=>old.reject(new Error("unmounted")));
  assert.equal(good.isConnected,false); assert.equal(box.childElementCount,0);
});
await test("late decode from a prior displayed node cannot invalidate a replacement source", async({box,render})=>{
  await render(photo()); await load(image(box)); const good=image(box), old=deferred(); good.decode=()=>old.promise;
  selected(good,{width:0,complete:false,candidate:640}); await resize(); await frame();
  await render(photo("/b.jpg")); const candidate=box.querySelector('img[aria-hidden="true"]'); await load(candidate,{width:400,candidate:640});
  const replacement=image(box); selected(replacement,{width:400,candidate:640}); assert.equal(state(box),"ready");
  selected(good,{width:0,candidate:640}); await act(async()=>old.reject(new Error("old source")));
  assert.equal(state(box),"ready"); assert.equal(image(box),replacement); assert.notEqual(replacement,good);
});
assert.equal(fetches,0,"selected-resource validation never fetches metadata/auth/certificates");
globalThis.setTimeout=realTimeout;globalThis.clearTimeout=realClearTimeout;dom.window.close();
console.log(`RESPONSIVE_PHOTO_OK ${checks} actual Next Image mounted scenarios; selected terminal states controlled, browser pixel/selection proof separate`);
process.exit(0);
