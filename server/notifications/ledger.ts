import { randomUUID } from "crypto";
import {
  Prisma,
  type PrismaClient,
  type NotificationDelivery,
} from "@prisma/client";
import { PushError } from "./contracts";
export async function consumeBudget(
  db: PrismaClient,
  day: string,
  kind: "sourceRequests" | "sendAttempts",
  limit: number,
) {
  await db.notificationUsageDay.upsert({
    where: { id: day },
    create: { id: day },
    update: {},
  });
  const changed = await db.notificationUsageDay.updateMany({
    where: { id: day, [kind]: { lt: limit } },
    data: { [kind]: { increment: 1 } },
  });
  if (!changed.count) throw new PushError(429, "WORK_BUDGET_EXHAUSTED");
}
export async function claimDeliveries(db: PrismaClient, now: Date, take = 10) {
  const token = randomUUID();
  const rows = await db.$queryRaw<NotificationDelivery[]>(Prisma.sql`
    UPDATE "NotificationDelivery" SET "claimToken"=${token},"leaseUntil"=${new Date(now.getTime() + 30000).toISOString()}::timestamp,"status"='sending',"updatedAt"=${now.toISOString()}::timestamp
    WHERE "id" IN (SELECT "id" FROM "NotificationDelivery" WHERE "status" IN ('pending','retry','sending')
      AND "dueAt"<=${now.toISOString()}::timestamp AND "expiresAt">${now.toISOString()}::timestamp AND "nextAttemptAt"<=${now.toISOString()}::timestamp
      AND ("leaseUntil" IS NULL OR "leaseUntil"<${now.toISOString()}::timestamp) AND "attempts"<3
      ORDER BY "dueAt","id" FOR UPDATE SKIP LOCKED LIMIT ${take}) RETURNING *`);
  return rows;
}
export async function finishDelivery(
  db: PrismaClient,
  row: NotificationDelivery,
  data: Prisma.NotificationDeliveryUpdateManyMutationInput,
) {
  return db.notificationDelivery.updateMany({
    where: { id: row.id, claimToken: row.claimToken, status: "sending" },
    data: { ...data, claimToken: null, leaseUntil: null },
  });
}

export async function claimDelivery(db: PrismaClient, now: Date) {
  return (await claimDeliveries(db, now, 1))[0] ?? null;
}
