import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("", { url: "https://www.jaothui.com/v2/profile" });
Object.assign(globalThis, { localStorage: dom.window.localStorage });
const { logoutAndClear } = await import("../utils/auth-logout.ts");
const { flushWebPushRevocations } = await import("../utils/web-push.ts");
const CURRENT = "jaothui.push.revocation.v1", PENDING = "jaothui.push.pending-revocations.v1";
const first = { installationId: "ee7f7833-014b-425c-bd07-ab1be37129f1", bindingGeneration: 1, revocationToken: `1.${"a".repeat(43)}` };
const next = { ...first, bindingGeneration: 2, revocationToken: `2.${"b".repeat(43)}` };
const seed = () => { localStorage.clear(); localStorage.setItem(CURRENT, JSON.stringify(first)); };
const ok = body => ({ ok: true, json: async () => body });
let clears = 0, calls = 0;
seed();
assert.equal(await logoutAndClear(() => clears++, async (url, options) => {
  calls++; assert.equal(url, "/api/auth/logout");
  assert.deepEqual(JSON.parse(options.body), { pushRevocation: { installationId: first.installationId, revocationToken: first.revocationToken } });
  assert.deepEqual(JSON.parse(localStorage.getItem(PENDING)), [first], "proof is durable before cookies can be cleared");
  assert.equal(localStorage.getItem(CURRENT), JSON.stringify(first), "proof is not discarded before acknowledgement");
  return ok({ success: true, pushRevocationProcessed: true });
}), true);
assert.equal(calls, 1); assert.equal(clears, 1); assert.equal(localStorage.getItem(CURRENT), null); assert.deepEqual(JSON.parse(localStorage.getItem(PENDING)), []);

for (const response of [async () => { throw new Error("offline"); }, async () => ({ ok: false, json: async () => ({ error: "temporarily unavailable" }) })]) {
  seed(); const before = clears;
  assert.equal(await logoutAndClear(() => clears++, response), false);
  assert.equal(clears, before); assert.deepEqual(JSON.parse(localStorage.getItem(CURRENT)), first); assert.deepEqual(JSON.parse(localStorage.getItem(PENDING)), [first]);
}
seed();
assert.equal(await logoutAndClear(() => clears++, async () => ok({ success: true })), true);
assert.deepEqual(JSON.parse(localStorage.getItem(CURRENT)), first, "an expired-cookie logout without push ack cannot discard revocation proof");
assert.deepEqual(JSON.parse(localStorage.getItem(PENDING)), [first]);
let retried = 0;
globalThis.fetch = async (url, options) => {
  retried++; assert.equal(url, "/api/notifications/revoke");
  assert.deepEqual(JSON.parse(options.body), { installationId: first.installationId, revocationToken: first.revocationToken });
  return ok({ ok: true, data: { enabled: false } });
};
await flushWebPushRevocations();
assert.equal(retried, 1); assert.equal(localStorage.getItem(CURRENT), null); assert.deepEqual(JSON.parse(localStorage.getItem(PENDING)), []);

seed();
let reply;
const stale = logoutAndClear(() => clears++, async () => new Promise(resolve => { reply = resolve; }));
localStorage.setItem(CURRENT, JSON.stringify(next)); localStorage.setItem(PENDING, JSON.stringify([first, next]));
reply(ok({ success: true, pushRevocationProcessed: true })); await stale;
assert.deepEqual(JSON.parse(localStorage.getItem(CURRENT)), next, "late A logout must not clear B revocation handle");
assert.deepEqual(JSON.parse(localStorage.getItem(PENDING)), [next]);

seed();
const originalSet = dom.window.Storage.prototype.setItem;
dom.window.Storage.prototype.setItem = function (key, value) { if (key === PENDING) throw new Error("storage full"); return originalSet.call(this, key, value); };
try {
  assert.equal(await logoutAndClear(() => clears++, async () => { throw new Error("offline"); }), false);
  assert.deepEqual(JSON.parse(localStorage.getItem(CURRENT)), first, "queue failure leaves original disable-only capability intact");
} finally { dom.window.Storage.prototype.setItem = originalSet; }
console.log("PASS web logout queues proof before request, expired-session ack, offline/503 retry, public revocation without auth and stale-generation/storage safety");
