import assert from "node:assert/strict";
import { parse, evaluate } from "groq-js";
import { ReminderSource, freshAudience } from "../server/notifications/source.ts";
import { eligible, reminderSlot } from "../server/notifications/policy.ts";

// Execute the actual production GROQ against synthetic documents: returning
// pre-selected fake rows would miss approval-ordering and parent-scope bugs.
const event = (id, type, patch = {}) => ({ _id: id, _type: "event", title: id,
  eventType: type, competitionState: "published", isActive: true,
  startAt: "2026-11-23", endAt: "2026-11-26", ...patch });
const registration = (id, eventId, owner) => ({ _id: id, _type: "eventRegister",
  event: { _ref: eventId }, user: { _ref: owner } });
const approval = (id, registrationId, result, date, eventId = "royal") => ({
  _id: id, _type: "approvment", event: { _ref: eventId },
  eventRegister: { _ref: registrationId }, approvementResult: result,
  approvementDate: date, _createdAt: date,
});
const dataset = [
  event("royal", "royal", { registrationActive: false }),
  event("normal", "normal", { registrationDeadline: "2026-11-01" }),
  event("unknown", "future-type"), event("closed", "normal", { competitionState: "closed" }),
  event("timestamp", "normal", { startAt: "2026-11-23T00:00:00+07:00" }),
  event("later", "normal", { startAt: "2026-11-24" }),
  registration("reg.01", "royal", "Uowner1"),
  registration("reg.02", "royal", "Uowner1"),
  registration("reg.03", "royal", "Uowner2"),
  registration("reg.04", "normal", "Uowner2"),
  registration("reg.05", "unknown", "Uowner1"),
  approval("approval.01", "reg.01", true, "2026-11-01T00:00:00Z"),
  approval("approval.02", "reg.01", false, "2026-11-02T00:00:00Z"),
  approval("approval.03", "reg.02", true, "2026-11-02T00:00:00Z"),
  approval("approval.04", "reg.03", true, "2026-11-02T00:00:00Z"),
  approval("approval.05", "reg.03", false, "2026-11-02T00:00:00Z"),
  approval("approval.unrelated", "reg.01", true, "2026-11-03T00:00:00Z", "normal"),
];
let requests = 0;
let counted = 0;
const client = { async fetch(query, params) {
  requests++;
  return (await evaluate(parse(query, { params }), { dataset, params })).get();
} };
const count = async () => { counted++; };
const source = new ReminderSource(client, count);

const first = await source.registrations("royal", "", 2);
assert.deepEqual(first.map(row => row._id), ["reg.01", "reg.02"]);
assert.equal(first[0].approval.approvementResult, false, "latest scoped rejection beats old acceptance");
assert.equal(first[1].approval.approvementResult, true);
const next = await source.registrations("royal", first.at(-1)._id, 2);
assert.deepEqual(next.map(row => row._id), ["reg.03"], "keyset continues without dropping recipients");
assert.equal(next[0].approval.approvementResult, false, "approval ID resolves equal-time ties");
assert.equal((await source.stillEligible("royal", "Uowner1")).eligible, true,
  "a rejected first buffalo must not hide a different accepted buffalo");
assert.equal((await source.stillEligible("royal", "Uowner2")).eligible, false);
assert.equal((await source.stillEligible("normal", "Uowner2")).eligible, true);
assert.equal((await source.stillEligible("unknown", "Uowner1")).eligible, false);
assert.equal((await source.stillEligible("royal", "Uother")).eligible, false);
const audience = await freshAudience(client, count, "royal", ["Uowner1", "Uowner2", "Uother"]);
assert.deepEqual(audience.lineIds, ["Uowner1"], "fresh batch uses latest per-registration approval");
const rows = await source.events("2026-11-23", "", 50);
const due = rows.filter(row => reminderSlot(row));
assert.deepEqual(due.map(row => row._id), ["normal", "royal", "timestamp"]);
assert.equal(eligible(rows.find(row => row._id === "unknown")), false);
assert.equal(counted, requests, "each real source request consumes the source budget");
console.log(`PASS push source GROQ: ${requests} synthetic queries; latest approval, multi-buffalo, keyset, signup-closed, unknown type, date and budget parity. No HTTP or database I/O.`);
