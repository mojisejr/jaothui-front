import assert from "node:assert/strict";
import { mock } from "bun:test";

const chip = "764040000000001";
const pedigree = {
  microchip: chip, tokenId: 12n, name: "ทะเบียนทดสอบ", sex: "female", color: "black",
  birthday: new Date("2020-01-01"), createdAt: "1700000000", updatedAt: "1700000000",
  image: null, detail: "", height: 150, dna: "N/A", rarity: "Normal",
};
const reward = { id: "r1", microchip: chip, eventName: "งานทดสอบ", rewardName: "ที่หนึ่ง", eventDate: new Date("2026-01-01") };
let rewards = [];
let rewardFails = true;
let rewardReads = 0;
let pedigreeReads = 0;
let certificateActive = true;
mock.module("../server/prisma.ts", () => ({ prisma: {
  pedigree: { async findUnique({ where }) {
    pedigreeReads++;
    if (where.microchip === "broken") throw new Error("database host not found");
    return where.microchip === chip ? pedigree : null;
  } },
  certificate: { async findUnique({ where, select }) {
    assert.equal(where.isActive, true);
    if (select) assert.deepEqual(select, { microchip: true });
    if (!certificateActive || where.microchip !== chip) return null;
    return select ? { microchip: chip } : { microchip: chip, isActive: true, updatedAt: new Date(), approvers: [] };
  } },
  reward: { async findMany({ where }) {
    rewardReads++;
    assert.deepEqual(where, { microchip: chip });
    if (rewardFails) throw new Error("unavailable");
    return rewards;
  } },
} }));

const { default: summary } = await import("../pages/api/mobile/v1/certs/[microchip]/summary.ts");
const { default: list } = await import("../pages/api/mobile/v1/certs/[microchip]/rewards/index.ts");
const { default: legacy } = await import("../pages/api/mobile/v1/certs/[microchip]/index.ts");

async function invoke(handler, microchip = chip, method = "GET") {
  const response = {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
  await handler({ method, query: { microchip }, headers: {} }, response);
  return response;
}

const result = await invoke(summary);
assert.equal(result.statusCode, 200);
assert.equal(result.body.data.buffalo.microchip, chip);
assert.deepEqual(result.body.data.buffalo.certificate, { microchip: chip });
assert.equal(rewardReads, 0);
assert.equal((await invoke(list)).statusCode, 500);
assert.equal(pedigreeReads, 1);

rewardFails = false;
assert.deepEqual((await invoke(list)).body.data, { rewards: [] });
rewards = [reward];
const { body: { data: split } } = await invoke(list);
const { body: { data: combined } } = await invoke(legacy);
assert.deepEqual(split.rewards, combined.rewards);
assert.equal(split.rewards[0].rewardName, reward.rewardName);
assert.equal(combined.buffalo.name, result.body.data.buffalo.name);
assert.equal(combined.buffalo.certificate.isActive, true);

certificateActive = false;
assert.equal((await invoke(summary)).body.data.buffalo.certificate, null);
assert.equal((await invoke(summary, "absent")).body.error.code, "NOT_FOUND");
assert.equal((await invoke(summary, "broken")).body.error.code, "INTERNAL_ERROR");
for (const handler of [summary, list]) {
  assert.equal((await invoke(handler, "")).statusCode, 400);
  assert.equal((await invoke(handler, chip, "POST")).statusCode, 405);
  assert.equal((await invoke(handler, chip, "OPTIONS")).statusCode, 204);
}
console.log("Mobile certificate sections passed: isolated reads, missing/failed reads, compatibility and public fields");
