import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";
import type { SanityClient } from "@sanity/client";
import { pushConfig } from "./config";
import { PushError, type RunReport } from "./contracts";
export type { RunReport } from "./contracts";
import { bangkokDay, tomorrowDay } from "./policy";
import { ReminderSource } from "./source";
import { consumeBudget } from "./ledger";
import { scanAudience } from "./scanner";
import { deliverBatch } from "./delivery";
import { collectReceipts } from "./receipts";
import { pruneNotificationState } from "./retention";
import { PushTransports } from "./transports";

export async function runReminders(
  db: PrismaClient,
  client: SanityClient,
  options: {
    env?: NodeJS.ProcessEnv;
    now?: () => Date;
    transport?: PushTransports;
    monotonicMs?: () => number;
  } = {},
) {
  const env = options.env ?? process.env,
    config = pushConfig(env),
    clock = options.now ?? (() => new Date()),
    monotonic = options.monotonicMs ?? Date.now,
    started = monotonic(),
    now = clock();
  const report: RunReport = {
    mode: config.mode,
    sourceRequests: 0,
    scanned: 0,
    endpoints: 0,
    attempts: 0,
    receipts: 0,
    elapsedMs: 0,
    stop: "complete",
    dryRun: config.mode === "dry-run",
    pending: 0,
    queueLagSeconds: 0,
  };
  if (config.mode === "off") return { ...report, stop: "disabled" };
  if (
    !report.dryRun &&
    (!config.sendingAllowed ||
      !config.dailyAttemptLimit ||
      !config.dailySourceLimitConfigured ||
      (config.mode === "pilot" && !config.pilotAccounts.length))
  )
    throw new PushError(503, "SENDING_NOT_APPROVED");
  const day = bangkokDay(now),
    targetDay = tomorrowDay(now),
    stateId = `${report.dryRun ? "dry" : "send"}:${day}`,
    lease = randomUUID();
  const withinBudget = () => monotonic() - started < config.budgetMs - 2500;
  const count = async () => {
    if (!withinBudget()) throw new PushError(429, "WORK_BUDGET_EXHAUSTED");
    await consumeBudget(
      db,
      `source:${day}`,
      "sourceRequests",
      config.dailySourceLimit,
    );
    report.sourceRequests++;
  };
  const transport = options.transport ?? new PushTransports(env);
  const source = new ReminderSource(client, count);
  await db.notificationScanState.upsert({
    where: { id: stateId },
    create: {
      id: stateId,
      cursor: {
        day: targetDay,
        eventAfter: "",
        registrationAfter: "",
        eventId: "",
      },
    },
    update: {},
  });
  const lock = await db.notificationScanState.updateMany({
    where: {
      id: stateId,
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
    },
    data: { leaseToken: lease, leaseUntil: new Date(now.getTime() + 30000) },
  });
  if (!lock.count) return { ...report, stop: "already_running" };
  try {
    if (!report.dryRun) {
      try {
        await collectReceipts(db, transport, clock(), report, withinBudget);
      } catch (error) {
        report.stop = "provider_receipts_unavailable";
        if (
          error instanceof PushError &&
          error.code === "PROVIDER_CREDENTIALS_INVALID"
        )
          await db.notificationScanState.upsert({
            where: { id: "transport:expo" },
            create: { id: "transport:expo", cursor: { paused: true } },
            update: { cursor: { paused: true } },
          });
      }
    }
    await scanAudience(
      db,
      source,
      config,
      clock,
      withinBudget,
      targetDay,
      stateId,
      lease,
      report,
    );
    if (!report.dryRun && withinBudget())
      await deliverBatch(
        db,
        client,
        count,
        transport,
        config,
        clock,
        withinBudget,
        stateId,
        report,
      );
    if (!report.dryRun && withinBudget()) {
      const maintenanceId = `retention:${day}`;
      if (
        !(await db.notificationScanState.findUnique({
          where: { id: maintenanceId },
        }))
      ) {
        await pruneNotificationState(db, clock(), withinBudget);
        if (withinBudget())
          await db.notificationScanState.upsert({
            where: { id: maintenanceId },
            create: { id: maintenanceId, cursor: {} },
            update: {},
          });
      }
    }
    if (!withinBudget()) report.stop = "work_budget_exhausted";
    else if (report.scanned >= config.maxPerRun)
      report.stop = "continuation_pending";
  } catch (error) {
    report.stop =
      error instanceof PushError
        ? error.code.toLowerCase()
        : "source_unavailable";
  } finally {
    if (!report.dryRun) {
      const queue = await db.notificationDelivery.aggregate({
        where: {
          status: { in: ["pending", "retry", "sending"] },
          expiresAt: { gt: clock() },
        },
        _count: { id: true },
        _min: { dueAt: true },
      });
      report.pending = queue._count.id;
      report.queueLagSeconds = queue._min.dueAt
        ? Math.max(
            0,
            Math.floor((clock().getTime() - queue._min.dueAt.getTime()) / 1000),
          )
        : 0;
    }
    report.elapsedMs = monotonic() - started;
    await db.notificationScanState.updateMany({
      where: { id: stateId, leaseToken: lease },
      data: {
        leaseToken: null,
        leaseUntil: null,
        lastReport: report,
        ...(report.stop === "complete" ? { lastSucceededAt: clock() } : {}),
      },
    });
  }
  return report;
}
