import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stats = await import("../server/services/home-stats.service.ts");
assert.equal(stats.formatHomeStatCount(1344), "1,344");
assert.equal(stats.formatHomeStatCount(0), "0");
assert.equal(stats.normalizeHomeStatCount(12n), 12);
for (const value of [null, undefined, "123", -1, NaN, Infinity, 1.5, 9007199254740992n]) {
  assert.throws(() => stats.normalizeHomeStatCount(value));
}

const url = stats.buildHomeEventCountUrl();
assert.equal(url.hostname, "q38mtihr.api.sanity.io");
assert.equal(url.pathname, "/v2024-06-17/data/query/production");
assert.equal(url.searchParams.get("perspective"), "published");
assert.deepEqual(JSON.parse(url.searchParams.get("$excludedIds")), ["a54fca84-3c46-4156-a0ac-3c2fc61f37c2"]);
assert.match(url.searchParams.get("query"), /_type == "event"/);
assert.match(url.searchParams.get("query"), /drafts/);
assert.doesNotMatch(url.searchParams.get("query"), /isActive|newsEvent|title/);
assert.deepEqual(stats.getHomeEventSourceConfig({ JAOTHUI_EVENT_SANITY_PROJECT_ID: "public123", JAOTHUI_EVENT_SANITY_DATASET: "test-data" }), { projectId: "public123", dataset: "test-data" });
assert.throws(() => stats.getHomeEventSourceConfig({ JAOTHUI_EVENT_SANITY_PROJECT_ID: "evil/host" }));

// Registry fixture deliberately includes inactive/admin users, duplicate tokenIds,
// multiple certificates for one microchip, and an orphan Certificate.
const users = [{ active: false, role: "ADMIN" }, { active: true, role: "USER" }];
const pedigrees = [{ microchip: "a", tokenId: 7 }, { microchip: "b", tokenId: 7 }, { microchip: "c", tokenId: 9 }];
const certificates = [{ microchip: "a", isActive: false }, { microchip: "a", isActive: true }, { microchip: "orphan", isActive: true }];
const statements = [];
const db = {
  $transaction: async (callback, options) => {
    assert.deepEqual(options, { maxWait: 1500, timeout: 6500 });
    return callback({
      $executeRaw: async (query) => { statements.push(query.join("")); },
      user: { count: async (...args) => { assert.equal(args.length, 0); return users.length; } },
      pedigree: { count: async (...args) => { assert.equal(args.length, 0); return pedigrees.length; } },
      $queryRaw: async (query) => {
        const sql = query.join("");
        assert.match(sql, /WHERE EXISTS/);
        assert.match(sql, /c\.microchip = p\.microchip/);
        assert.doesNotMatch(sql, /isActive|approved|certNo|dna|tokenId/);
        return [{ count: BigInt(pedigrees.filter((p) => certificates.some((c) => c.microchip === p.microchip)).length) }];
      },
    });
  },
};
assert.equal(await stats.countRegistryMetric("farmers", db), 2);
assert.equal(await stats.countRegistryMetric("buffalos", db), 3);
assert.equal(await stats.countRegistryMetric("verified", db), 1);
assert(statements.includes("SET TRANSACTION READ ONLY"));
assert(statements.includes("SET LOCAL statement_timeout = '5000ms'"));

let clock = Date.parse("2026-10-03T00:00:00Z");
const calls = { farmers: 0, buffalos: 0, events: 0, verified: 0 };
let eventFails = false;
const load = Object.fromEntries(Object.keys(calls).map((id, index) => [id, async () => {
  calls[id] += 1;
  if (id === "events" && eventFails) throw new Error("private source detail must not escape");
  return index === 0 ? 0 : index * 100;
}]));
const service = stats.createHomeStatsService(load, { now: () => clock });
const [first, concurrent] = await Promise.all([service(), service()]);
assert.strictEqual(first, concurrent);
assert.deepEqual(calls, { farmers: 1, buffalos: 1, events: 1, verified: 1 });
assert.equal(first.find((s) => s.id === "farmers").value, "0");
assert(first.every((s) => s.availability === "available" && s.observedAt));
for (const item of first) {
  assert.equal(typeof item.value, "string");
  assert.equal(typeof item.unit, "string");
  assert.equal(typeof item.label, "string");
  assert.equal(typeof item.id, "string");
  assert(!item.value.includes("+"));
}
clock += 59_999;
assert.strictEqual(await service(), first);
clock += 1;
eventFails = true;
const refreshed = await service();
assert.equal(calls.events, 2);
const unavailable = refreshed.find((s) => s.id === "events");
assert.deepEqual([unavailable.count, unavailable.value, unavailable.availability, unavailable.observedAt], [null, "—", "unavailable", null]);
assert(refreshed.filter((s) => s.id !== "events").every((s) => s.availability === "available"));
assert(!JSON.stringify(refreshed).includes("private"));
const timed = stats.createHomeStatsService({ ...load, events: () => new Promise(() => {}) }, { timeoutMs: 5 });
assert.equal((await timed()).find((s) => s.id === "events").count, null);

const web = readFileSync(new URL("../pages/v2/index.tsx", import.meta.url), "utf8");
const mobile = readFileSync(new URL("../server/mobile/public-journey.ts", import.meta.url), "utf8");
const source = readFileSync(new URL("../server/services/home-stats.service.ts", import.meta.url), "utf8");
assert(web.includes("getHomeStats()") && mobile.includes("getHomeStats()"));
assert(!web.includes("1,680+") && !mobile.includes("MOBILE_HOME_STATS"));
assert(!source.includes("NEXT_PUBLIC_") && !source.includes("SANITY_TOKEN"));
console.log("Home stats contract passed: definitions, event eligibility, cache/dedup, partial errors, timeout, legacy display");
