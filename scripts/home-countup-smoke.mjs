import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";
import { HomeCountUp, countAt, countWidthRulers, validCount, formatCount, HOME_COUNT_UP_DURATION_MS } from "../components/v2/homeCountUp.ts";
import { HomeStatValue } from "../components/v2/HomeStatsGrid.tsx";
import { StatCard } from "../components/v2/StatCard.tsx";

function frameClock() {
  let time = 0, nextId = 0;
  const frames = new Map();
  return {
    request: (callback) => { frames.set(++nextId, callback); return nextId; },
    cancel: (id) => { frames.delete(id); },
    now: () => time,
    step: (timestamp) => {
      time = timestamp;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((frame) => frame(timestamp));
    },
    pending: () => frames.size,
  };
}
const targets = [{ id: "farmers", count: 1180 }, { id: "buffalos", count: 1344 },
  { id: "events", count: 15 }, { id: "verified", count: 331 },
  { id: "zero", count: 0 }, { id: "missing", count: null }];

assert.equal(HOME_COUNT_UP_DURATION_MS, 1200);
assert.equal(formatCount(1344), "1,344");
assert.equal(formatCount(9007199254740991), "9,007,199,254,740,991");
assert.deepEqual(countWidthRulers(15), ["00", "11", "22", "33", "44", "55", "66", "77", "88", "99"]);
assert(countWidthRulers(331).includes("200") === false);
assert(countWidthRulers(331).includes("000") && countWidthRulers(331).includes("888"));
assert.equal(countWidthRulers(1344)[8], "8,888");
for (const bad of [null, undefined, NaN, Infinity, -1, 1.1, "1180", Number.MAX_SAFE_INTEGER + 1]) {
  assert.equal(validCount(bad), null);
}
assert.equal(validCount(0), 0);
for (const target of [0, 15, 1344, Number.MAX_SAFE_INTEGER]) {
  let previous = 0;
  for (let elapsed = 0; elapsed <= 1200; elapsed += 10) {
    const value = countAt(target, elapsed);
    assert(value >= previous && value <= target);
    assert(Number.isSafeInteger(value));
    previous = value;
  }
  assert.equal(countAt(target, -10), 0);
  assert.equal(countAt(target, 1200), target);
  assert.equal(countAt(target, 10_000), target);
}
assert.equal(countAt(1344, 600), 1176);
assert(countAt(1344, 300) > countAt(1344, 600) - countAt(1344, 300));
assert(countAt(1344, 900) - countAt(1344, 600) > 1344 - countAt(1344, 900));

const clock = frameClock();
const controller = new HomeCountUp(targets, clock);
assert.equal(controller.snapshot("buffalos").current, 1344, "SSR/initial hydration is final");
let farmerNotifications = 0;
const unsubscribe = controller.subscribe("farmers", () => { farmerNotifications++; });
controller.prepare(true, false, false);
assert.equal(controller.snapshot("buffalos").current, 0);
assert.equal(controller.snapshot("zero").current, 0);
assert.equal(controller.snapshot("missing").current, null);
controller.reveal();
assert.equal(clock.pending(), 1, "all counters share one frame loop");
clock.step(600);
assert.equal(controller.snapshot("buffalos").current, 1176);
assert.equal(controller.snapshot("events").current, 13);
const notifications = farmerNotifications;
clock.step(600);
assert.equal(farmerNotifications, notifications, "unchanged rounded value doesn't rerender");
clock.step(1200);
assert.equal(clock.pending(), 0);
for (const { id, count } of targets) assert.equal(controller.snapshot(id).current, count);
controller.reveal();
controller.prepare(true, false, false);
controller.replaceTargets(targets.map((item) => ({ ...item })));
assert.equal(clock.pending(), 0, "scroll/retry/rerender cannot replay");
controller.replaceTargets(targets.map((item) => item.id === "buffalos" ? { ...item, count: 1000 } : item));
assert.equal(controller.snapshot("buffalos").current, 1000, "lower refreshed target shows direct final");
unsubscribe();

for (const [offscreen, reduced, hidden] of [[false, false, false], [true, true, false], [true, false, true]]) {
  const c = frameClock(), model = new HomeCountUp(targets, c);
  model.prepare(offscreen, reduced, hidden);
  model.reveal();
  assert.equal(model.snapshot("buffalos").current, 1344);
  model.prepare(true, false, false);
  model.reveal();
  assert.equal(c.pending(), 0, "late preference/viewport changes cannot reset an exposed final value");
}
for (const cause of ["reduce-motion", "background", "pagehide", "route-blur", "unmount"]) {
  const c = frameClock(), model = new HomeCountUp(targets, c);
  model.prepare(true, false, false);
  model.reveal();
  c.step(300);
  if (cause === "unmount") model.detach(); else model.settle();
  assert.equal(c.pending(), 0, cause);
  assert.equal(model.snapshot("buffalos").current, 1344, cause);
  model.prepare(true, false, false);
  model.reveal();
  assert.equal(c.pending(), 0, `${cause} must not restart on resume`);
}
{
  const c = frameClock(), model = new HomeCountUp(targets, c);
  model.prepare(true, false, false);
  model.detach(); // StrictMode unexposed effect replay is safe.
  assert.equal(model.snapshot("buffalos").current, 1344);
  model.prepare(true, false, false);
  model.reveal();
  assert.equal(c.pending(), 1);
  model.replaceTargets([{ id: "buffalos", count: 3 }]);
  assert.equal(model.snapshot("buffalos").current, 3);
  assert.equal(c.pending(), 0, "target changes cancel running frames");
}
for (const count of [0, null, undefined, NaN, Infinity, -2]) {
  const c = frameClock(), model = new HomeCountUp([{ id: "invalid", count }], c);
  model.prepare(true, false, false);
  model.reveal();
  assert.equal(c.pending(), 0, "zero/old/invalid payload stays static");
}

const stat = { id: "buffalos", count: 1344, value: "1,344", label: "กระบือในฐานข้อมูล", unit: "ตัว" };
const ssrModel = new HomeCountUp([stat], frameClock());
const renderMetric = (item, model) => renderToString(React.createElement(StatCard, {
  label: item.label, unit: item.unit, accessibleValue: `${item.label}: ${item.value} ${item.unit}`,
  value: React.createElement(HomeStatValue, { stat: item, controller: model }),
}));
const serverHTML = renderMetric(stat, ssrModel);
assert.equal(serverHTML, renderMetric(stat, new HomeCountUp([stat], frameClock())), "first client snapshot matches server markup");
assert(serverHTML.includes('<span class="sr-only">กระบือในฐานข้อมูล: 1,344 ตัว</span>'));
assert(serverHTML.includes('data-count="1344"'));
assert(serverHTML.includes('data-testid="home-stat-count-buffalos"'));
assert(serverHTML.includes("invisible col-start-1 row-start-1"));
assert.equal((serverHTML.match(/data-count-width-ruler=/g) ?? []).length, 10,
  "SSR reserves widest digit cases before hydration, not only narrow final digits");
assert(serverHTML.includes('class="absolute inset-0" data-testid="home-stat-count-buffalos"'),
  "visual intermediate is out of flow so it cannot enlarge reserved width");
assert(serverHTML.includes("tabular-nums"));
assert(!serverHTML.includes("aria-live"));
// useSyncExternalStore deliberately returns server snapshots during SSR. In real
// client render the authoritative aria label is also derived from unchanged props.
ssrModel.prepare(true, false, false);
const animatedHTML = renderMetric(stat, ssrModel);
assert(animatedHTML.includes('<span class="sr-only">กระบือในฐานข้อมูล: 1,344 ตัว</span>'));
assert(animatedHTML.includes('data-count="0"'));
for (const count of [15, 331]) {
  const item = { ...stat, count, value: formatCount(count) };
  const model = new HomeCountUp([item], frameClock());
  const initialHTML = renderMetric(item, model);
  model.prepare(true, false, false);
  const countingHTML = renderMetric(item, model);
  const rulerMarkup = (html) => html.match(/<span[^>]*data-count-width-ruler[^>]*>[^<]*<\/span>/g);
  assert.deepEqual(rulerMarkup(initialHTML), rulerMarkup(countingHTML), "331/15 Prompt width rulers are fixed across frames");
  assert.equal(rulerMarkup(initialHTML).length, 10);
  assert(initialHTML.includes(`>${"8".repeat(String(count).length)}</span>`));
}
const oldStat = { ...stat, count: undefined, value: "legacy final" };
assert(renderMetric(oldStat, new HomeCountUp([oldStat], frameClock())).includes("legacy final"));
assert(renderMetric({ ...stat, count: 4, value: "4" }, ssrModel).includes('data-count="4"'), "prop update renders direct final before effect");
const showcaseHTML = renderToString(React.createElement(StatCard, { value: "plain", label: "Static" }));
assert(showcaseHTML.includes("plain") && !showcaseHTML.includes("data-count"));

const source = readFileSync(new URL("../components/v2/HomeStatsGrid.tsx", import.meta.url), "utf8");
assert(source.includes('useInView(ref, { once: true })'));
for (const event of ["visibilitychange", "pagehide", "routeChangeStart", "change"]) assert(source.includes(event));
assert(source.includes("controller.detach()"));
assert(source.includes("preference.removeEventListener"));
assert(source.includes("window.removeEventListener"));
assert(source.includes("router.events.off"));
console.log("Home count-up passed: exact 1200ms ease-out, SSR initial parity, static fallbacks, stable aria/width, one loop, no replay, live-reduction/hidden/unmount/target cleanup");
