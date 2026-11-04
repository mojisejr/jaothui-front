import type { PrismaClient } from "@prisma/client";
import type { SanityClient } from "@sanity/client";
import type { RunReport } from "./contracts";
import { pushConfig } from "./config";
import { reminderSlot } from "./policy";
import { freshAudience } from "./source";
import { claimDeliveries, finishDelivery, consumeBudget } from "./ledger";
import { PushTransports } from "./transports";
export async function deliverBatch(
  db: PrismaClient,
  client: SanityClient,
  count: () => Promise<void>,
  transport: PushTransports,
  config: ReturnType<typeof pushConfig>,
  clock: () => Date,
  withinBudget: () => boolean,
  day: string,
  report: RunReport,
) {
  await db.notificationDelivery.updateMany({
    where: {
      expiresAt: { lte: clock() },
      status: { in: ["pending", "retry", "sending"] },
    },
    data: { status: "expired", claimToken: null, leaseUntil: null },
  });
  const rows = await claimDeliveries(db, clock(), config.maxPerRun);
  try {
    const fresh = new Map<string, Awaited<ReturnType<typeof freshAudience>>>();
    for (const eventId of [...new Set(rows.map((r) => r.eventId))]) {
      if (!withinBudget()) break;
      fresh.set(
        eventId,
        await freshAudience(client, count, eventId, [
          ...new Set(
            rows
              .filter((r) => r.eventId === eventId)
              .map((r) => r.sourceLineId),
          ),
        ]),
      );
    }
    for (const row of rows) {
      if (!withinBudget()) break;
      const result = fresh.get(row.eventId),
        slot = result?.event && reminderSlot(result.event);
      const i = await db.notificationInstallation.findUnique({
        where: { id: row.installationId },
        include: { account: { include: { identities: true } } },
      });
      const valid =
        slot &&
        slot.schedule === row.schedule &&
        clock() < slot.expiresAt &&
        result!.lineIds.includes(row.sourceLineId) &&
        i?.enabled &&
        i.accountId === row.accountId &&
        i.generation === row.generation &&
        i.account.status === "ACTIVE" &&
        !i.account.deletedAt &&
        i.account.identities.filter((a) => a.provider === "line").length ===
          1 &&
        i.account.identities.some(
          (a) => a.provider === "line" && a.providerUserId === row.sourceLineId,
        );
      if (!valid) {
        await finishDelivery(db, row, { status: "suppressed" });
        continue;
      }
      const provider = i.platform === "web" ? "web" : "expo";
      const pause = await db.notificationScanState.findUnique({
        where: { id: `transport:${provider}` },
      });
      if (
        (pause?.cursor as { paused?: boolean } | undefined)?.paused === true
      ) {
        report.stop = "provider_credentials_invalid";
        continue;
      }
      await consumeBudget(db, day, "sendAttempts", config.dailyAttemptLimit);
      const claimed = await db.notificationDelivery.updateMany({
        where: {
          id: row.id,
          claimToken: row.claimToken,
          status: "sending",
          expiresAt: { gt: clock() },
        },
        data: { attempts: { increment: 1 } },
      });
      if (!claimed.count) continue;
      report.attempts++;
      const outcome = await transport.send(
        i,
        { ...row, eventTitle: result!.event!.title ?? row.eventTitle },
        clock(),
      );
      const status =
        outcome.status === "invalid"
          ? "invalid"
          : outcome.status === "credentials"
            ? "retry"
            : outcome.status === "retry" && row.attempts >= 2
              ? "failed"
              : outcome.status;
      await finishDelivery(db, row, {
        status,
        lastError: ["retry", "unknown", "credentials"].includes(outcome.status)
          ? `provider_${outcome.status}`
          : null,
        ticketId: outcome.ticketId ?? null,
        receiptDueAt: outcome.ticketId
          ? new Date(clock().getTime() + 15 * 60000)
          : null,
        nextAttemptAt: new Date(
          clock().getTime() + Math.min(3600000, 60000 * 2 ** row.attempts),
        ),
      });
      if (outcome.status === "invalid")
        await db.notificationInstallation.updateMany({
          where: { id: i.id, generation: i.generation },
          data: { enabled: false, generation: { increment: 1 } },
        });
      if (outcome.status === "credentials") {
        await db.notificationScanState.upsert({
          where: { id: `transport:${provider}` },
          create: { id: `transport:${provider}`, cursor: { paused: true } },
          update: { cursor: { paused: true } },
        });
        report.stop = "provider_credentials_invalid";
      }
    }
  } finally {
    // Unprocessed claims return to pending; unique keys remain intact.
    if (rows.length)
      await db.notificationDelivery.updateMany({
        where: {
          id: { in: rows.map((r) => r.id) },
          claimToken: { in: rows.map((r) => r.claimToken!) },
          status: "sending",
        },
        data: { status: "retry", claimToken: null, leaseUntil: null },
      });
  }
}
