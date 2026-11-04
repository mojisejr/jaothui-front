// Explicit isolated local fixture only. Never inherits the application's DB.
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  registerInstallation,
  disableInstallation,
  revokeInstallation,
} from "../server/notifications/installations.ts";
import {
  claimDeliveries,
  finishDelivery,
  consumeBudget,
} from "../server/notifications/ledger.ts";
import { runReminders } from "../server/notifications/engine.ts";
import { pruneNotificationState } from "../server/notifications/retention.ts";
const raw = process.env.NOTIFICATION_TEST_DATABASE_URL;
if (!raw)
  throw Error(
    "Set NOTIFICATION_TEST_DATABASE_URL to an isolated local fixture database",
  );
const u = new URL(raw);
if (
  u.protocol !== "postgresql:" ||
  u.hostname !== "127.0.0.1" ||
  u.port !== "55439" ||
  u.pathname !== "/jaothui_push_fixture" ||
  u.username !== "fixture" ||
  process.env.DATABASE_URL !== raw
)
  throw Error("Refusing non-isolated notification test database");
const db = new PrismaClient({ datasources: { db: { url: raw } }, log: [] });
let checks = 0;
const check = async (name, fn) => {
  await fn();
  checks++;
  console.log(`PASS ${name}`);
};
const id = "00000000-0000-4000-8000-000000000001",
  accountId = "notification-fixture-a",
  other = "notification-fixture-b";
const native = (i = id, token = "ExpoPushToken[abcdefghijklmnop]") => ({
  installationId: i,
  platform: "android",
  expoPushToken: token,
});
const age = () =>
  db.notificationInstallation.updateMany({
    data: { updatedAt: new Date(Date.now() - 120000) },
  });
try {
  await db.notificationDelivery.deleteMany();
  await db.notificationInstallation.deleteMany();
  await db.notificationScanState.deleteMany();
  await db.notificationUsageDay.deleteMany();
  for (const x of [accountId, other])
    await db.account.upsert({
      where: { id: x },
      create: { id: x },
      update: { status: "ACTIVE" },
    });
  let first;
  await check("active account binds server-owned installation", async () => {
    first = await registerInstallation(db, accountId, native());
    assert.equal(first.bindingGeneration, 1);
    assert.equal(
      (await db.notificationInstallation.findUnique({ where: { id } }))
        .accountId,
      accountId,
    );
  });
  await check(
    "cross-account guessed UUID cannot replace endpoint",
    async () => {
      await age();
      await assert.rejects(
        registerInstallation(
          db,
          other,
          native(id, "ExpoPushToken[otherfixturetoken]"),
        ),
        (e) => e.code === "INSTALLATION_CONFLICT",
      );
    },
  );
  await check(
    "lost PUT response detected by generation; stale revoke cannot disable repaired binding",
    async () => {
      await age();
      const second = await registerInstallation(db, accountId, native());
      assert.equal(second.bindingGeneration, 2);
      await revokeInstallation(db, id, first.revocationToken);
      assert.equal(
        (await db.notificationInstallation.findUnique({ where: { id } }))
          .enabled,
        true,
      );
      await revokeInstallation(db, id, second.revocationToken);
      assert.equal(
        (await db.notificationInstallation.findUnique({ where: { id } }))
          .enabled,
        false,
      );
      await revokeInstallation(db, id, second.revocationToken);
    },
  );
  await check(
    "fresh owner rebind preserves stale-generation guard",
    async () => {
      await age();
      await registerInstallation(db, other, native());
      await revokeInstallation(db, id, first.revocationToken);
      assert.equal(
        (await db.notificationInstallation.findUnique({ where: { id } }))
          .accountId,
        other,
      );
      assert.equal(
        (await db.notificationInstallation.findUnique({ where: { id } }))
          .enabled,
        true,
      );
      await disableInstallation(db, accountId, id);
      assert.equal(
        (await db.notificationInstallation.findUnique({ where: { id } }))
          .enabled,
        true,
      );
    },
  );
  await check(
    "concurrent guessed-ID registrations cannot overwrite owner",
    async () => {
      const same = "00000000-0000-4000-8000-000000000010";
      const results = await Promise.allSettled([
        registerInstallation(
          db,
          accountId,
          native(same, "ExpoPushToken[firstconcurrent]"),
        ),
        registerInstallation(
          db,
          other,
          native(same, "ExpoPushToken[otherconcurrent]"),
        ),
      ]);
      assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
    },
  );
  const row = {
    accountId: other,
    installationId: id,
    generation: (
      await db.notificationInstallation.findUnique({ where: { id } })
    ).generation,
    eventId: "fixture-event",
    slot: "d-1",
    schedule: "schedule-fixture",
    sourceLineId: "line-fixture",
    startDay: "2026-11-23",
    eventTitle: "public event",
    dueAt: new Date("2026-11-22T02:00:00Z"),
    expiresAt: new Date("2026-11-22T17:00:00Z"),
  };
  await check(
    "DB unique stable endpoint key ignores generation/token rotation",
    async () => {
      await db.notificationDelivery.create({
        data: { ...row, id: "delivery-fixture" },
      });
      await assert.rejects(
        db.notificationDelivery.create({
          data: { ...row, id: "duplicate-fixture", generation: 999 },
        }),
        (e) => e.code === "P2002",
      );
    },
  );
  await check("concurrent SQL SKIP LOCKED claims never overlap", async () => {
    const groups = await Promise.all([
      claimDeliveries(db, new Date("2026-11-22T03:00:00Z")),
      claimDeliveries(db, new Date("2026-11-22T03:00:00Z")),
    ]);
    assert.equal(groups.flat().length, 1);
    assert.equal(new Set(groups.flat().map((x) => x.id)).size, 1);
  });
  await check(
    "lease expires, stale completion cannot clobber new attempt",
    async () => {
      const old = await db.notificationDelivery.findUnique({
        where: { id: "delivery-fixture" },
      });
      const fresh = (
        await claimDeliveries(db, new Date("2026-11-22T03:01:00Z"))
      )[0];
      assert(fresh);
      assert.notEqual(old.claimToken, fresh.claimToken);
      assert.equal(
        (await finishDelivery(db, old, { status: "accepted" })).count,
        0,
      );
      assert.equal(
        (await finishDelivery(db, fresh, { status: "accepted" })).count,
        1,
      );
    },
  );
  await check("budget increment atomic under concurrency", async () => {
    const result = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        consumeBudget(db, "fixture-budget", "sendAttempts", 3),
      ),
    );
    assert.equal(result.filter((v) => v.status === "fulfilled").length, 3);
    assert.equal(
      (
        await db.notificationUsageDay.findUnique({
          where: { id: "fixture-budget" },
        })
      ).sendAttempts,
      3,
    );
  });
  await check(
    "real mode refuses implicit approval/budgets, OFF never source calls",
    async () => {
      let n = 0;
      const client = {
        fetch: async () => {
          n++;
          throw Error("not called");
        },
      };
      assert.equal(
        (await runReminders(db, client, { env: {} })).stop,
        "disabled",
      );
      await assert.rejects(
        runReminders(db, client, { env: { JAOTHUI_PUSH_MODE: "live" } }),
        (e) => e.code === "SENDING_NOT_APPROVED",
      );
      assert.equal(n, 0);
    },
  );
  await check("dryrun neither sends nor consumes live dedup", async () => {
    const before = await db.notificationDelivery.count();
    let calls = 0;
    const client = {
      fetch: async () => {
        calls++;
        return [];
      },
    };
    const transport = {
      send: async () => {
        throw Error("MUST NOT SEND");
      },
      receipts: async () => {
        throw Error("MUST NOT SEND");
      },
    };
    const result = await runReminders(db, client, {
      env: { JAOTHUI_PUSH_MODE: "dry-run" },
      now: () => new Date("2026-11-22T03:00:00Z"),
      transport,
    });
    assert.equal(result.dryRun, true);
    assert.equal(result.attempts, 0);
    assert.equal(calls, 1);
    assert.equal(await db.notificationDelivery.count(), before);
  });
  await check("empty off-window does not query Sanity", async () => {
    let calls = 0;
    await runReminders(
      db,
      {
        fetch: async () => {
          calls++;
          throw Error("MUST NOT QUERY");
        },
      },
      {
        env: { JAOTHUI_PUSH_MODE: "dry-run" },
        now: () => new Date("2026-11-22T01:00:00Z"),
      },
    );
    assert.equal(calls, 0);
  });
  await check(
    "RLS enabled and browser role grants absent on all capability tables",
    async () => {
      const tables =
        await db.$queryRaw`SELECT relname,relrowsecurity FROM pg_class WHERE relname IN ('NotificationInstallation','NotificationDelivery','NotificationScanState','NotificationUsageDay')`;
      assert.equal(tables.length, 4);
      assert(tables.every((x) => x.relrowsecurity));
      const grants =
        await db.$queryRaw`SELECT has_table_privilege('anon','"NotificationInstallation"','SELECT') AS anon,has_table_privilege('authenticated','"NotificationInstallation"','SELECT') AS authenticated`;
      assert.equal(grants[0].anon, false);
      assert.equal(grants[0].authenticated, false);
    },
  );
  await check(
    "per-account registration rate includes first-time IDs",
    async () => {
      await age();
      for (let j = 20; j < 30; j++) {
        await registerInstallation(
          db,
          accountId,
          native(
            `00000000-0000-4000-8000-${String(j).padStart(12, "0")}`,
            `ExpoPushToken[fixturetoken${String(j).padStart(5, "0")}]`,
          ),
        );
      }
      await assert.rejects(
        registerInstallation(
          db,
          accountId,
          native(
            "00000000-0000-4000-8000-000000000099",
            "ExpoPushToken[ratedfixturetoken]",
          ),
        ),
        (e) => e.code === "RATE_LIMITED",
      );
    },
  );
  await check(
    "per-account installation count stays bounded even outside rate window",
    async () => {
      await age();
      while (
        (await db.notificationInstallation.count({ where: { accountId } })) < 20
      ) {
        const n = await db.notificationInstallation.count({
          where: { accountId },
        });
        await registerInstallation(
          db,
          accountId,
          native(
            `00000000-0000-4000-8000-${String(2000 + n).padStart(12, "0")}`,
            `ExpoPushToken[countfixturetoken${n}]`,
          ),
        );
        await age();
      }
      await assert.rejects(
        registerInstallation(
          db,
          accountId,
          native(
            "00000000-0000-4000-8000-000000009999",
            "ExpoPushToken[countoverlimitfixture]",
          ),
        ),
        (e) => e.code === "RATE_LIMITED",
      );
    },
  );
  await check(
    "retention prunes only expired90day operational records, keeps live tombstones",
    async () => {
      const current = new Date("2026-11-22T03:00:00Z");
      const old = new Date(current.getTime() - 100 * 86400000);
      const retained = new Date(current.getTime() - 40 * 86400000);
      const endpoint = "00000000-0000-4000-8000-000000008888";
      await db.notificationInstallation.create({
        data: {
          id: endpoint,
          accountId: other,
          platform: "android",
          target: { type: "expo", token: "ExpoPushToken[retentionfixture]" },
          targetHash: "retention-fixture-hash",
          revocationHash: "fixture",
          enabled: false,
          updatedAt: old,
        },
      });
      await db.notificationDelivery.create({
        data: {
          ...row,
          id: "retention-expired",
          installationId: endpoint,
          expiresAt: old,
        },
      });
      await db.notificationDelivery.create({
        data: {
          ...row,
          id: "retention-protected",
          installationId: endpoint,
          eventId: "retention-protected-event",
          expiresAt: retained,
        },
      });
      await pruneNotificationState(db, current, () => true);
      assert.equal(
        await db.notificationDelivery.findUnique({
          where: { id: "retention-expired" },
        }),
        null,
      );
      assert(
        await db.notificationDelivery.findUnique({
          where: { id: "retention-protected" },
        }),
      );
      assert(
        await db.notificationInstallation.findUnique({
          where: { id: endpoint },
        }),
      );
    },
  );
  console.log(
    `${checks} isolated PostgreSQL notification checks passed; no real provider calls.`,
  );
} finally {
  await db.$disconnect();
}
