import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";
import { mock } from "bun:test";
import { MobileEventService } from "../server/mobile/events/service.ts";
import { createWebEventsHandler } from "../server/web/events.ts";
import { validateEventDates, uniqueOpenEvents, eventEntryHref } from "../utils/web-events.ts";

let count = 0;
async function check(name, run) { await run(); count++; console.log(`PASS ${name}`); }
const event = { _type: "event", _id: "e", title: "งานประกวดทดสอบ", competitionState: "published", isActive: true, registrationActive: true,
  startAt: "2026-11-20", endAt: "2026-11-21", registrationStartAt: "2026-11-01", registrationDeadline: "2026-11-19", location: "สนามทดสอบ", eventType: "royal" };
const docs = Array.from({ length: 7 }, (_, i) => ({ ...event, _id: `event.${i}`, title: `งานประกวด ${i}`, startAt: `2026-11-${20 + i}`, endAt: `2026-11-${21 + i}` }));
docs.push({ ...event, _id: "closed", registrationActive: false }, { ...event, _id: "drafts.hidden" }, { ...event, _id: "versions.hidden" }, { ...event, _id: "unpublished", competitionState: "draft" }, { ...event, _id: "ended", endAt: "2026-10-01" }, { ...event, _id: "future", registrationStartAt: "2026-11-15" });
const sanity = { fetch: async () => docs, config: () => ({ projectId: "fixture", dataset: "fixture" }) };
const service = new MobileEventService(sanity, () => new Date("2026-11-02T12:00:00Z"), async () => {}, {});
function response() { return { statusCode: 0, headers: {}, status(code) { this.statusCode = code; return this; }, setHeader(key, value) { this.headers[key] = value; }, json(body) { this.body = body; return this; } }; }
const handler = createWebEventsHandler(input => service.list(input), () => true);
async function get(query = {}, overrides = {}) { const res = response(); await handler({ method: "GET", query, headers: { cookie: "ignored-user-session" }, ...overrides }, res); return res; }
await check("mobile open policy, stable cursor, 5/6+ and exact DTO reused", async () => {
  const res = await get({ limit: "5" }); assert.equal(res.statusCode, 200); assert.equal(res.body.data.items.length, 5); assert.equal(res.body.data.totalOpen, 7);
  assert.deepEqual(res.body.data, await service.list({ limit: 5 })); assert(res.body.data.nextCursor);
  const next = await get({ limit: "5", cursor: res.body.data.nextCursor }); assert.equal(next.body.data.items.length, 2);
  assert.equal(new Set([...res.body.data.items, ...next.body.data.items].map(i => i.id)).size, 7);
  assert.equal(res.headers["Cache-Control"], "public, max-age=0, s-maxage=60"); assert.equal(res.headers["Set-Cookie"], undefined);
  assert.deepEqual(Object.keys(res.body.data.items[0]).sort(), ["id", "name", "eventType", "imageUrl", "competitionStartDay", "competitionEndDay", "registrationStartDay", "registrationDeadline", "publicRegistration", "location"].sort());
});
await check("public name/calendar overlap filters and successful zero", async () => {
  assert.equal((await get({ q: "ประกวด 3" })).body.data.items[0].id, "event.3");
  assert.equal((await get({ from: "2026-11-23", to: "2026-11-23" })).body.data.items.length, 2);
  assert.deepEqual((await get({ q: "ไม่พบงาน" })).body.data.items, []);
});
await check("strict API filters/dates/cursor and method validation", async () => {
  for (const query of [{ from: "2026-02-30" }, { from: "2026-11-04", to: "2026-11-02" }, { limit: "0" }, { limit: "x" }, { q: ["one", "two"] }, { cursor: "bad" }, { accountId: "foreign" }]) assert.equal((await get(query)).statusCode, 422);
  assert.equal((await get({}, { method: "POST" })).statusCode, 405);
});
await check("feature default off never touches catalogue; outage is honest503/no-store", async () => {
  let reads = 0; const off = createWebEventsHandler(async () => { reads++; throw new Error("must not read"); });
  const original = process.env.JAOTHUI_EVENT_SSO_ENABLED; delete process.env.JAOTHUI_EVENT_SSO_ENABLED;
  const res = response(); await off({ method: "GET", query: {}, headers: {} }, res); assert.equal(res.statusCode, 503); assert.equal(reads, 0); assert.equal(res.headers["Cache-Control"], "no-store");
  if (original === undefined) delete process.env.JAOTHUI_EVENT_SSO_ENABLED; else process.env.JAOTHUI_EVENT_SSO_ENABLED = original;
  const failed = response(); await createWebEventsHandler(async () => { throw new Error("upstream failure"); }, () => true)({ method: "GET", query: {} }, failed);
  assert.equal(failed.statusCode, 503); assert.equal(failed.headers["Cache-Control"], "no-store"); assert(!JSON.stringify(failed.body).includes("upstream"));
});
await check("calendar validation rejects impossible/reversed/BE dates; clear and dedupe", () => {
  assert.equal(validateEventDates("", ""), null); assert.equal(validateEventDates("2028-02-29", "2028-03-01"), null);
  for (const [from, to] of [["2026-02-29", ""], ["2026-11-04", "2026-11-02"], ["2569-11-02", ""], ["bad", ""]]) assert(validateEventDates(from, to));
  const a = { id: "e", publicRegistration: "open" }; assert.equal(uniqueOpenEvents([a, a, { id: "closed", publicRegistration: "closed-date" }]).length, 1);
  assert.equal(eventEntryHref("event.x"), "/v2/event-entry?eventId=event.x");
});
mock.module("next/link", () => ({ default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) }));
mock.module("next/image", () => ({ default: ({ fill, priority, ...props }) => React.createElement("img", props) }));
const { HomeEventZone } = await import("../components/v2/HomeEventZone.tsx");
const { EventList } = await import("../components/v2/EventList.tsx");
const { EventPreviewCard } = await import("../components/v2/EventPreviewCard.tsx");
await check("real rail/list/card server rendering has no window, fetch or timer", async () => {
  assert.equal(typeof window, "undefined");
  const original = globalThis.fetch; globalThis.fetch = () => { throw new Error("SSR must not fetch"); };
  try {
    assert(renderToString(React.createElement(HomeEventZone)).includes("กำลังโหลดงานประกวด"));
    assert(renderToString(React.createElement(EventList)).includes("ค้นหางานประกวด"));
    const card = renderToString(React.createElement(EventPreviewCard, { event: (await service.list()).items[0] }));
    assert(card.includes("aspect-video")); assert(card.includes("object-contain")); assert(!card.includes("object-cover")); assert(card.includes("/v2/event-entry?eventId=event.0")); assert(!card.includes("target="));
  } finally { globalThis.fetch = original; }
});
await check("actual events page is public and renders real V2Layout before hydration", async () => {
  const { default: EventsPage, getStaticProps } = await import("../pages/v2/events/index.tsx");
  assert.equal(EventsPage.publicPage, true);
  const app = readFileSync(new URL("../pages/_app.tsx", import.meta.url), "utf8");
  assert(app.indexOf("if (PageComponent.publicPage)") < app.indexOf("if (!showChild)"));
  assert.match(app, /if \(PageComponent.publicPage\) \{\s*return <PageComponent/);
  const previous = process.env.JAOTHUI_EVENT_SSO_ENABLED;
  try {
    delete process.env.JAOTHUI_EVENT_SSO_ENABLED;
    const off = await getStaticProps({}); assert.equal(off.revalidate, 60); assert.deepEqual(off.props, { eventsEnabled: false });
    const html = renderToString(React.createElement(EventsPage, off.props));
    assert(html.includes("ระบบกิจกรรมยังไม่พร้อมใช้งาน")); assert(html.includes("bg-background")); assert.equal((html.match(/<main/g) ?? []).length, 1);
    process.env.JAOTHUI_EVENT_SSO_ENABLED = "true";
    const on = await getStaticProps({}); assert.deepEqual(on.props, { eventsEnabled: true });
    const enabled = renderToString(React.createElement(EventsPage, on.props)); assert(enabled.includes("ค้นหางานประกวด")); assert(enabled.includes("กำลังโหลดงานประกวด"));
    assert(!enabled.includes("NEXT_PUBLIC"));
  } finally { if (previous === undefined) delete process.env.JAOTHUI_EVENT_SSO_ENABLED; else process.env.JAOTHUI_EVENT_SSO_ENABLED = previous; }
});
await check("Home keeps public SSG60 and original editorial/download/photo surfaces", () => {
  const source = readFileSync(new URL("../pages/v2/index.tsx", import.meta.url), "utf8");
  assert(source.indexOf("<HomeStatsGrid") < source.indexOf("<HomeEventZone")); assert(source.indexOf("<HomeEventZone") < source.indexOf("<HomeAppDownload />"));
  for (const value of ["revalidate: 60", "<NewsEventRail items={newsEvents}", "<HomeAppDownloadPrompt", "<Featured />", 'eventsEnabled: process.env.JAOTHUI_EVENT_SSO_ENABLED === "true"']) assert(source.includes(value));
  assert(!source.includes("getServerSideProps"));
});
console.log(`WEB_EVENTS_CONTRACT_OK ${count} API/model/SSR cases; no browser/provider proof claimed`);
