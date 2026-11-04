import { randomUUID } from "crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { pushConfig } from "./config";
import type { RunReport } from "./contracts";
import { eligible, reminderSlot } from "./policy";
import { ReminderSource } from "./source";
type Cursor = {
  day: string;
  eventAfter: string;
  registrationAfter: string;
  eventId: string;
};
export async function scanAudience(
  db: PrismaClient,
  source: ReminderSource,
  config: ReturnType<typeof pushConfig>,
  clock: () => Date,
  withinBudget: () => boolean,
  targetDay: string,
  stateId: string,
  lease: string,
  report: RunReport,
) {
  const due = new Date(`${targetDay}T00:00:00+07:00`).getTime() - 15 * 3600000;
  let cursor = (
    await db.notificationScanState.findUniqueOrThrow({
      where: { id: stateId },
    })
  ).cursor as unknown as Cursor;
  while (
    clock().getTime() >= due &&
    withinBudget() &&
    report.scanned < config.maxPerRun
  ) {
    const events = await source.events(targetDay, cursor.eventAfter, 1);
    if (!events.length) {
      cursor = {
        day: targetDay,
        eventAfter: "",
        registrationAfter: "",
        eventId: "",
      };
      break;
    }
    const event = events[0],
      slot = reminderSlot(event);
    if (!slot || clock() >= slot.expiresAt) {
      cursor = {
        ...cursor,
        eventAfter: event._id,
        eventId: "",
        registrationAfter: "",
      };
      await db.notificationScanState.updateMany({
        where: { id: stateId, leaseToken: lease },
        data: { cursor },
      });
      continue;
    }
    if (cursor.eventId !== event._id)
      cursor = { ...cursor, eventId: event._id, registrationAfter: "" };
    const take = Math.min(5, config.maxPerRun - report.scanned),
      registrations = await source.registrations(
        event._id,
        cursor.registrationAfter,
        take,
      );
    const lines = [
      ...new Set(
        registrations
          .filter((r) => eligible(event, r.approval))
          .map((r) => r.lineId)
          .filter(Boolean),
      ),
    ];
    const candidates = lines.length
      ? await db.accountIdentity.findMany({
          where: {
            provider: "line",
            providerUserId: { in: lines },
            account: {
              status: "ACTIVE",
              role: { not: "REVIEWER_SANDBOX" },
              deletedAt: null,
            },
          },
          include: {
            account: {
              include: { identities: { where: { provider: "line" } } },
            },
          },
        })
      : [];
    const identities = candidates.filter(
      (i) => i.account.identities.length === 1,
    );
    const installs = identities.length
      ? await db.notificationInstallation.findMany({
          where: {
            accountId: { in: identities.map((i) => i.accountId) },
            enabled: true,
          },
        })
      : [];
    report.scanned += registrations.length;
    report.endpoints += installs.length;
    if (!report.dryRun) {
      const data = installs
        .filter(
          (i) =>
            config.mode !== "pilot" ||
            config.pilotAccounts.includes(i.accountId),
        )
        .map((i) => ({
          id: randomUUID(),
          accountId: i.accountId,
          installationId: i.id,
          generation: i.generation,
          eventId: event._id,
          slot: slot.slot,
          schedule: slot.schedule,
          sourceLineId: identities.find((a) => a.accountId === i.accountId)!
            .providerUserId,
          startDay: slot.startDay,
          eventTitle: (event.title ?? "งานประกวด").slice(0, 200),
          dueAt: slot.dueAt,
          expiresAt: slot.expiresAt,
        }));
      if (data.length)
        await db.notificationDelivery.createMany({
          data,
          skipDuplicates: true,
        });
      // Rotation/relogin updates only unsent authorization guards, never a sent key.
      if (data.length)
        await db.$executeRaw(
          Prisma.sql`UPDATE "NotificationDelivery" d SET "generation"=i."generation", "status"='pending', "nextAttemptAt"=${clock().toISOString()}::timestamp,"updatedAt"=${clock().toISOString()}::timestamp FROM "NotificationInstallation" i WHERE d."installationId"=i."id" AND d."accountId"=i."accountId" AND i."enabled"=true AND d."eventId"=${event._id} AND d."schedule"=${slot.schedule} AND d."accountId" IN (${Prisma.join(data.map((r) => r.accountId))}) AND d."status" IN ('pending','retry','suppressed') AND (d."generation"<>i."generation" OR d."status"='suppressed')`,
        );
    }
    if (registrations.length < take)
      cursor = {
        ...cursor,
        eventAfter: event._id,
        eventId: "",
        registrationAfter: "",
      };
    else
      cursor = {
        ...cursor,
        registrationAfter: registrations[registrations.length - 1]._id,
      };
    await db.notificationScanState.updateMany({
      where: { id: stateId, leaseToken: lease },
      data: { cursor },
    });
  }
  await db.notificationScanState.updateMany({
    where: { id: stateId, leaseToken: lease },
    data: { cursor },
  });
}
