import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mock } from "bun:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement, SVGElement: dom.window.SVGElement, Element: dom.window.Element, IS_REACT_ACT_ENVIRONMENT: true });
const h = React.createElement;
const linkEvents = [];
mock.module("next/link", () => ({ default: ({ children, href, onClick, ...props }) => h("a", { href, ...props, onClick: event => {
  onClick?.(event); linkEvents.push({ href, prevented: event.defaultPrevented }); event.preventDefault();
} }, children) }));
mock.module("next/image", () => ({ default: ({ fill, priority, ...props }) => h("img", props) }));
mock.module(new URL("../components/v2/PhotoRefresh.tsx", import.meta.url).pathname, () => ({ usePublishedPhoto: (_identity, src) => ({ ref: React.useRef(null), visible: false, imageUrl: src }) }));
mock.module(new URL("../contexts/bitkubNextContext.tsx", import.meta.url).pathname, () => ({ useBitkubNext: () => ({ isConnected: true }) }));
const { CopyMicrochip } = await import("../components/v2/CopyMicrochip.tsx");
const { StatRow } = await import("../components/v2/StatRow.tsx");
const { BuffaloCard } = await import("../components/v2/BuffaloCard.tsx");
const { default: PedigreeCard } = await import("../components/Shared/Card/PedigreeCard.tsx");
const { default: PedigreeSmallCard } = await import("../components/Profile/PedigreeSmallCard.tsx");
const chip = "001234567890123";
let calls, writer;
Object.defineProperty(navigator, "clipboard", { configurable: true, get: () => writer ? { writeText: value => { calls.push(value); return writer(value); } } : undefined });
const realSetTimeout = globalThis.setTimeout, realClearTimeout = globalThis.clearTimeout;
const timers = new Map(); let timerId = 100000;
globalThis.setTimeout = (fn, ms, ...args) => {
  if (ms !== 1800) return realSetTimeout(fn, ms, ...args);
  const id = ++timerId; timers.set(id, () => fn(...args)); return id;
};
globalThis.clearTimeout = id => { if (!timers.delete(id)) realClearTimeout(id); };
let count = 0;
async function test(name, run) {
  calls = []; linkEvents.length = 0; writer = async () => {};
  const box = document.createElement("div"); document.body.append(box);
  const root = createRoot(box);
  const render = async element => act(async () => root.render(element));
  const click = async () => act(async () => box.querySelector('button[aria-label^="คัดลอกเลข"]')?.click());
  try { await run({ box, render, click }); count++; console.log(`PASS ${name}`); }
  finally { await act(async () => root.unmount()); box.remove(); assert.equal(timers.size, 0, "feedback timer cleaned on unmount"); }
}
await test("awaits actual resolution, preserves leading zeros, repeat copy", async ({ box, render, click }) => {
  let done;
  writer = () => new Promise(resolve => { done = resolve; });
  await render(h(CopyMicrochip, { value: chip })); await click();
  assert.deepEqual(calls, [chip]); assert.equal(box.querySelector('[role="status"]').textContent, "");
  assert.equal(box.querySelector("button").disabled, true);
  await act(async () => done()); assert.equal(box.querySelector('[role="status"]').textContent, "คัดลอกแล้ว");
  assert.equal(box.querySelector("button").disabled, false);
  writer = async () => {}; await click(); assert.deepEqual(calls, [chip, chip]);
});
await test("permission rejection is honest and can retry", async ({ box, render, click }) => {
  writer = async () => { throw new DOMException("denied", "NotAllowedError"); };
  await render(h(CopyMicrochip, { value: chip })); await click();
  assert.equal(box.querySelector('[role="status"]').textContent, "คัดลอกไม่สำเร็จ");
  assert.equal(box.querySelector("button").disabled, false); assert(box.textContent.includes(chip));
  writer = async () => {}; await click(); assert.equal(box.querySelector('[role="status"]').textContent, "คัดลอกแล้ว");
});
await test("unavailable Clipboard API has failure feedback", async ({ box, render, click }) => {
  writer = undefined; await render(h(CopyMicrochip, { value: chip })); await click();
  assert.equal(box.querySelector('[role="status"]').textContent, "คัดลอกไม่สำเร็จ"); assert.deepEqual(calls, []);
});
await test("missing/N/A values never offer a copy target", async ({ box, render }) => {
  for (const value of [undefined, null, "", "N/A"]) { await render(h(CopyMicrochip, { value })); assert.equal(box.querySelector("button"), null); }
});
await test("changing identity clears success and pending old completion", async ({ box, render, click }) => {
  let done; writer = () => new Promise(resolve => { done = resolve; });
  await render(h(CopyMicrochip, { value: chip })); await click();
  await render(h(CopyMicrochip, { value: "900000000000001" }));
  await act(async () => done()); assert.equal(box.querySelector('[role="status"]').textContent, "");
  assert.equal(box.querySelector("button").disabled, false);
});
await test("success feedback resets and another animal has independent state", async ({ box, render }) => {
  await render(h("div", null, h(CopyMicrochip, { value: chip }), h(CopyMicrochip, { value: "900000000000001" })));
  await act(async () => box.querySelector("button").click());
  assert.deepEqual([...box.querySelectorAll('[role="status"]')].map(node => node.textContent), ["คัดลอกแล้ว", ""]);
  await act(async () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn()); });
  assert.equal(box.querySelector('[role="status"]').textContent, "");
  await act(async () => box.querySelectorAll("button")[1].click());
  assert.deepEqual(calls, [chip, "900000000000001"]);
});
await test("unmounted pending promise does not schedule feedback", async ({ render, click }) => {
  let done; writer = () => new Promise(resolve => { done = resolve; });
  await render(h(CopyMicrochip, { value: chip })); await click(); await render(null);
  await act(async () => done()); assert.equal(timers.size, 0);
});
await test("shared card copy does not navigate, ordinary button still opens", async ({ box, render, click }) => {
  let navigation = 0;
  await render(h("div", { onClick: () => navigation++ }, h(BuffaloCard, { name: "กระบือทดสอบ", chip, microchip: chip, onClick: () => navigation++ })));
  await click(); assert.equal(navigation, 0); assert.deepEqual(calls, [chip]);
  const copy = box.querySelector('button[aria-label^="คัดลอก"]');
  assert.equal(copy.closest("span.relative").className.includes("z-20"), true);
  assert.equal(copy.closest("a"), null); assert.equal(copy.parentElement.closest("button"), null);
  await act(async () => box.querySelector('button[aria-label^="ดูรายละเอียด"]').click()); assert.equal(navigation, 2);
});
await test("formatted/truncated display copies raw prop, React nodes never stringify", async ({ box, render, click }) => {
  await render(h(BuffaloCard, { name: "ชื่อยาว", chip: h("span", null, "001..123"), microchip: chip }));
  await click(); assert.deepEqual(calls, [chip]);
  await render(h(BuffaloCard, { name: "ไม่มีเลข", chip: h("span", null, "กำลังโหลด") }));
  assert.equal(box.querySelector('button[aria-label^="คัดลอก"]'), null);
});
const data = { microchip: chip, name: "กระบือทดสอบ", birthdate: "2020-01-01", origin: "thai", calculatedAge: 20, tokenId: 123, sex: "male", image: null };
for (const [name, Component] of [["legacy listing", PedigreeCard], ["compact profile", PedigreeSmallCard]]) {
  await test(`${name}: copy leaves navigation/loading alone`, async ({ box, render, click }) => {
    await render(h(Component, { data, vote: true, eventId: "test" }));
    const event = new dom.window.MouseEvent("click", { bubbles: true, cancelable: true });
    await act(async () => box.querySelector('button[aria-label^="คัดลอก"]').dispatchEvent(event));
    assert.deepEqual(calls, [chip]); assert.equal(event.defaultPrevented, true); assert.deepEqual(linkEvents, []);
    assert.equal(box.querySelector(".absolute.top-0.left-0"), null);
    assert(box.querySelector('a[aria-label^="ดูรายละเอียด"]').href.includes(chip));
    assert.equal(box.querySelector('button[aria-label^="คัดลอก"]').closest("a"), null);
    await act(async () => box.querySelector('a[aria-label^="ดูรายละเอียด"]').click());
    assert.equal(linkEvents.length, 1); assert.equal(linkEvents[0].prevented, false);
    assert(box.querySelector(".absolute.top-0.left-0"), "ordinary card click still sets loading overlay");
  });
}
await test("real detail StatRow composes a separate accessible control", async ({ box, render, click }) => {
  await render(h(StatRow, { label: "Signature ID", value: h(CopyMicrochip, { value: chip }) }));
  const button = box.querySelector("button"); assert.equal(button.getAttribute("type"), "button");
  assert.equal(button.closest("a"), null); assert.equal(button.getAttribute("aria-label"), `คัดลอกเลขไมโครชิป ${chip}`);
  await click(); assert.deepEqual(calls, [chip]); assert.equal(box.querySelector('[role="status"]').textContent, "คัดลอกแล้ว");
});
// Route bindings are static evidence only; runtime routes are checked separately.
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
assert.match(read("components/Cert/Detail/BuffaloDetailV2.tsx"), /label="Signature ID" value=\{<CopyMicrochip value=\{mc\}/);
for (const file of ["pages/v2/index.tsx", "pages/v2/buffalo.tsx", "pages/v2/profile.tsx"]) assert.match(read(file), /microchip=\{(?:item|cert)\.microchip\}/);
console.log(`MICROCHIP_COPY_OK ${count} mounted behavior cases; clipboard/browser proof remains separate`);
