import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  registerInstallation,
  disableInstallation,
} from "../server/notifications/installations.ts";
import { runReminders } from "../server/notifications/engine.ts";
const raw = process.env.NOTIFICATION_TEST_DATABASE_URL;
if (!raw) throw Error("Set isolated NOTIFICATION_TEST_DATABASE_URL");
const u = new URL(raw);
if (
  u.hostname !== "127.0.0.1" ||
  u.port !== "55439" ||
  u.pathname !== "/jaothui_push_fixture" ||
  u.username !== "fixture" ||
  process.env.DATABASE_URL !== raw
)
  throw Error("Refusing non-isolated database");
const db = new PrismaClient({ datasources: { db: { url: raw } }, log: [] });
const aid = "notification-engine-fixture",
  line = "line-engine-fixture",
  iid = "00000000-0000-4000-8000-000000000500";
const now = new Date("2026-11-22T03:00:00Z");
const base = {
  _id: "engine-fixture-event",
  eventType: "normal",
  startAt: "2026-11-23",
  title: "งานทดสอบสังเคราะห์",
  competitionState: "published",
  isActive: true,
};
const env = {
  JAOTHUI_PUSH_MODE: "live",
  JAOTHUI_PUSH_SENDS_APPROVED: "true",
  VERCEL_ENV: "production",
  JAOTHUI_PUSH_DAILY_SOURCE_REQUEST_LIMIT: "10000",
  JAOTHUI_PUSH_DAILY_ATTEMPT_LIMIT: "500",
};
let checks = 0,
  sends = 0,
  audience = true,
  sendStatus = "accepted";
const check = async (name, fn) => {
  await fn();
  checks++;
  console.log(`PASS ${name}`);
};
function source(event = base, registrations = [{ _id: "reg1", lineId: line }]) {
  return {
    fetch: async (query, args) => {
      if (query.includes('"lineIds":array::unique'))
        return { event, lineIds: audience ? [line] : [] };
      if (query.includes('_type=="eventRegister"'))
        return registrations
          .filter((r) => r._id > args.after)
          .slice(0, args.take);
      return event._id > args.after ? [event] : [];
    },
  };
}
const transport = {
  send: async () => {
    sends++;
    return {
      status: sendStatus,
      ...(sendStatus === "submitted" ? { ticketId: "fixture-ticket" } : {}),
    };
  },
  receipts: async () => ({ "fixture-ticket": { status: "ok" } }),
};
const run = (extra = {}) =>
  runReminders(db, source(), { env, now: () => now, transport, ...extra });
async function reset(eventId = base._id) {
  await db.notificationDelivery.deleteMany({ where: { accountId: aid } });
  await db.notificationScanState.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "send:" } },
        { id: { startsWith: "transport:" } },
      ],
    },
  });
  sends = 0;
  audience = true;
  sendStatus = "accepted";
  await db.notificationInstallation.update({
    where: { id: iid },
    data: { enabled: true, updatedAt: new Date(Date.now() - 2000) },
  });
}
try {
  await db.account.upsert({
    where: { id: aid },
    create: { id: aid },
    update: { status: "ACTIVE" },
  });
  await db.accountIdentity.upsert({
    where: {
      provider_providerUserId: { provider: "line", providerUserId: line },
    },
    create: { accountId: aid, provider: "line", providerUserId: line },
    update: { accountId: aid },
  });
  await db.notificationDelivery.deleteMany({ where: { accountId: aid } });
  await db.notificationInstallation.deleteMany({ where: { id: iid } });
  await registerInstallation(db, aid, {
    installationId: iid,
    platform: "android",
    expoPushToken: "ExpoPushToken[enginefixturetoken]",
  });
  await check(
    "full pipeline dedups multiple buffalo and two levels into one endpoint send",
    async () => {
      await reset();
      await run({ transport, env, now: () => now, ...{} });
      assert.equal(sends, 1);
      await runReminders(
        db,
        source(base, [
          { _id: "reg1", lineId: line },
          { _id: "reg2", lineId: line },
        ]),
        { env, now: () => now, transport },
      );
      assert.equal(sends, 1);
      assert.equal(
        await db.notificationDelivery.count({ where: { accountId: aid } }),
        1,
      );
    },
  );
  await check(
    "rotation and same-account re-registration never regenerate delivered key",
    async () => {
      await db.notificationInstallation.update({
        where: { id: iid },
        data: { updatedAt: new Date(Date.now() - 2000) },
      });
      await registerInstallation(db, aid, {
        installationId: iid,
        platform: "android",
        expoPushToken: "ExpoPushToken[enginefixturetokenrotated]",
      });
      await run();
      assert.equal(sends, 1);
    },
  );
  await check(
    "fresh source suppresses changed eligibility before transport",
    async () => {
      await reset();
      audience = false;
      await run();
      assert.equal(sends, 0);
      assert.equal(
        (await db.notificationDelivery.findFirst({ where: { accountId: aid } }))
          .status,
        "suppressed",
      );
    },
  );
  await check(
    "eligible unsent suppression can revive without resetting accepted delivery",
    async () => {
      audience = true;
      await run();
      assert.equal(sends, 1);
      assert.equal(
        (await db.notificationDelivery.findFirst({ where: { accountId: aid } }))
          .status,
        "accepted",
      );
      await run();
      assert.equal(sends, 1);
    },
  );
  await check("explicit optout prevents queued notification", async () => {
    await reset();
    audience = false;
    await run();
    audience = true;
    await disableInstallation(db, aid, iid);
    await run();
    assert.equal(sends, 0);
  });
  await check(
    "Royal pending excluded, late acceptance eligible before expiry",
    async () => {
      await reset();
      const royal = { ...base, eventType: "royal" };
      await runReminders(
        db,
        source(royal, [
          {
            _id: "royal-reg",
            lineId: line,
            approval: { approvementResult: false },
          },
        ]),
        { env, now: () => now, transport },
      );
      assert.equal(sends, 0);
      await runReminders(
        db,
        source(royal, [
          {
            _id: "royal-reg",
            lineId: line,
            approval: { approvementResult: true },
          },
        ]),
        { env, now: () => now, transport },
      );
      assert.equal(sends, 1);
    },
  );
  await check(
    "rescheduling suppresses old unsent slot before send",
    async () => {
      await reset();
      audience = false;
      await run();
      audience = true;
      const moved = { ...base, startAt: "2026-11-24" };
      await runReminders(db, source(moved), { env, now: () => now, transport });
      assert.equal(sends, 0);
    },
  );
  await check(
    "provider ambiguous outcome kept unknown, not blindly resent",
    async () => {
      await reset();
      sendStatus = "unknown";
      await run();
      assert.equal(sends, 1);
      assert.equal(
        (await db.notificationDelivery.findFirst({ where: { accountId: aid } }))
          .status,
        "unknown",
      );
      await run();
      assert.equal(sends, 1);
    },
  );
  await check(
    "explicit provider rejection retries with backoff and bounded attempts",
    async () => {
      await reset();
      sendStatus = "retry";
      await run();
      const row = await db.notificationDelivery.findFirst({
        where: { accountId: aid },
      });
      assert.equal(row.status, "retry");
      assert.equal(row.attempts, 1);
      await run();
      assert.equal(sends, 1);
      for (let j = 0; j < 2; j++) {
        await db.notificationDelivery.update({
          where: { id: row.id },
          data: { nextAttemptAt: now },
        });
        await run();
      }
      assert.equal(sends, 3);
      assert.equal(
        (await db.notificationDelivery.findUnique({ where: { id: row.id } }))
          .status,
        "failed",
      );
    },
  );
  await check(
    "credential pause is persistent and paused=false explicitly resumes",
    async () => {
      await reset();
      sendStatus = "credentials";
      await run();
      assert.equal(sends, 1);
      await run();
      assert.equal(sends, 1);
      await db.notificationScanState.update({
        where: { id: "transport:expo" },
        data: { cursor: { paused: false } },
      });
      await db.notificationDelivery.updateMany({
        where: { accountId: aid },
        data: { nextAttemptAt: now },
      });
      sendStatus = "accepted";
      await run();
      assert.equal(sends, 2);
    },
  );
  await check(
    "receipts collected later and acceptance is distinct from submission",
    async () => {
      await reset();
      sendStatus = "submitted";
      await run();
      let row = await db.notificationDelivery.findFirst({
        where: { accountId: aid },
      });
      assert.equal(row.status, "submitted");
      assert.equal(row.receiptDueAt.toISOString(), "2026-11-22T03:15:00.000Z");
      await runReminders(db, source(), {
        env,
        now: () => new Date("2026-11-22T03:16:00Z"),
        transport,
      });
      row = await db.notificationDelivery.findUnique({ where: { id: row.id } });
      assert.equal(row.status, "accepted");
      assert.equal(sends, 1);
    },
  );
  await check("expired day never begins provider send", async () => {
    await reset();
    audience = false;
    await run();
    audience = true;
    await runReminders(db, source(), {
      env,
      now: () => new Date("2026-11-22T17:00:00Z"),
      transport,
    });
    assert.equal(sends, 0);
  });
  await check("row limit reports continuation, not complete", async () => {
    await reset();
    const out = await runReminders(db, source(), {
      env: { ...env, JAOTHUI_PUSH_MAX_PER_RUN: "1" },
      now: () => now,
      transport,
    });
    assert.equal(out.stop, "continuation_pending");
  });
  await check(
    "skipped closed-event progress survives processing time exhaustion",
    async () => {
      await reset();
      let elapsed = 0;
      const closed = { ...base, competitionState: "closed" };
      const client = {
        fetch: async () => {
          elapsed = 8000;
          return [closed];
        },
      };
      const out = await runReminders(db, client, {
        env,
        now: () => now,
        transport,
        monotonicMs: () => elapsed,
      });
      assert.equal(out.stop, "work_budget_exhausted");
      const state = await db.notificationScanState.findUnique({
        where: { id: "send:2026-11-22" },
      });
      assert.equal(state.cursor.eventAfter, base._id);
    },
  );
  await check(
    "dry and real sources share one physical daily counter",
    async () => {
      const before = (
        await db.notificationUsageDay.findUnique({
          where: { id: "source:2026-11-22" },
        })
      ).sourceRequests;
      await runReminders(
        db,
        { fetch: async () => [] },
        { env: { JAOTHUI_PUSH_MODE: "dry-run" }, now: () => now },
      );
      assert.equal(
        (
          await db.notificationUsageDay.findUnique({
            where: { id: "source:2026-11-22" },
          })
        ).sourceRequests,
        before + 1,
      );
    },
  );
  await check(
    "registration keyset pages resume without lost rows or repeated logical notification",
    async () => {
      await reset();
      const registrations = Array.from({ length: 5 }, (_, j) => ({
        _id: `page-${j}`,
        lineId: line,
      }));
      for (let j = 0; j < 6; j++)
        await runReminders(db, source(base, registrations), {
          env: { ...env, JAOTHUI_PUSH_MAX_PER_RUN: "1" },
          now: () => now,
          transport,
        });
      assert.equal(sends, 1);
      const state = await db.notificationScanState.findUnique({
        where: { id: "send:2026-11-22" },
      });
      assert.equal(state.cursor.registrationAfter, "");
    },
  );
  await check(
    "fresh-source batches stop within elapsed budget and release claims in bulk",
    async () => {
      await reset();
      const installation = await db.notificationInstallation.findUnique({
        where: { id: iid },
      });
      for (let j = 0; j < 10; j++)
        await db.notificationDelivery.create({
          data: {
            id: `budget-job-${j}`,
            accountId: aid,
            installationId: iid,
            generation: installation.generation,
            eventId: `budget-event-${j}`,
            slot: "d-1",
            schedule: "synthetic",
            sourceLineId: line,
            startDay: "2026-11-23",
            eventTitle: "synthetic",
            dueAt: new Date("2026-11-22T02:00:00Z"),
            expiresAt: new Date("2026-11-22T17:00:00Z"),
          },
        });
      let elapsed = 0,
        freshCalls = 0;
      const client = {
        fetch: async (query, args) => {
          if (query.includes('"lineIds":array::unique')) {
            freshCalls++;
            elapsed += 2500;
            return { event: { ...base, _id: args.eventId }, lineIds: [line] };
          }
          return [];
        },
      };
      const result = await runReminders(db, client, {
        env,
        now: () => now,
        transport,
        monotonicMs: () => elapsed,
      });
      assert(freshCalls <= 3);
      assert.equal(sends, 0);
      assert.equal(result.stop, "work_budget_exhausted");
      assert.equal(
        await db.notificationDelivery.count({
          where: { accountId: aid, status: "sending" },
        }),
        0,
      );
      assert.equal(
        await db.notificationDelivery.count({
          where: { accountId: aid, status: "retry" },
        }),
        10,
      );
    },
  );
  await check(
    "receipt loop leaves unprocessed rows queued when budget ends",
    async () => {
      await reset();
      const installation = await db.notificationInstallation.findUnique({
        where: { id: iid },
      });
      for (let j = 0; j < 30; j++)
        await db.notificationDelivery.create({
          data: {
            id: `receipt-budget-${j}`,
            accountId: aid,
            installationId: iid,
            generation: installation.generation,
            eventId: `receipt-event-${j}`,
            slot: "d-1",
            schedule: "synthetic",
            sourceLineId: line,
            startDay: "2026-11-23",
            eventTitle: "synthetic",
            status: "submitted",
            ticketId: `receipt-fixture-${j}`,
            receiptDueAt: now,
            dueAt: new Date("2026-11-22T02:00:00Z"),
            expiresAt: new Date("2026-11-22T17:00:00Z"),
          },
        });
      let elapsed = 0;
      const result = await runReminders(
        db,
        { fetch: async () => [] },
        {
          env,
          now: () => now,
          transport: {
            ...transport,
            receipts: async (ids) =>
              Object.fromEntries(ids.map((id) => [id, { status: "ok" }])),
          },
          monotonicMs: () => {
            elapsed += 1000;
            return elapsed;
          },
        },
      );
      assert(result.receipts > 0 && result.receipts < 30);
      assert.equal(result.stop, "work_budget_exhausted");
      assert(
        (await db.notificationDelivery.count({
          where: { accountId: aid, status: "submitted" },
        })) > 0,
      );
    },
  );
  await check(
    "source outage records failure rather than successful empty audience",
    async () => {
      await reset();
      const result = await runReminders(
        db,
        {
          fetch: async () => {
            throw Error("synthetic source unavailable");
          },
        },
        { env, now: () => now, transport },
      );
      assert.equal(result.stop, "source_unavailable");
      const state = await db.notificationScanState.findUnique({
        where: { id: "send:2026-11-22" },
      });
      assert.equal(state.lastSucceededAt, null);
      assert.equal(state.lastReport.stop, "source_unavailable");
      assert.equal(sends, 0);
    },
  );
  console.log(
    `${checks} engine PostgreSQL integration checks passed; provider sends/receipts simulated.`,
  );
} finally {
  await db.$disconnect();
}
