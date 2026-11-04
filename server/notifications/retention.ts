import type { PrismaClient } from "@prisma/client";
// Only disposable notification operational rows, never source applications/events.
// A bounded daily sweep keeps tombstones through expiry plus 90 days.
export async function pruneNotificationState(
  db: PrismaClient,
  now: Date,
  withinBudget: () => boolean,
) {
  if (!withinBudget()) return;
  const cutoff = new Date(now.getTime() - 90 * 86400000);
  const old = await db.notificationDelivery.findMany({
    where: { expiresAt: { lt: cutoff } },
    select: { id: true },
    take: 100,
  });
  if (old.length && withinBudget())
    await db.notificationDelivery.deleteMany({
      where: { id: { in: old.map((r) => r.id) }, expiresAt: { lt: cutoff } },
    });
  if (!withinBudget()) return;
  const disabled = await db.notificationInstallation.findMany({
    where: {
      enabled: false,
      updatedAt: { lt: cutoff },
      deliveries: { none: {} },
    },
    select: { id: true },
    take: 20,
  });
  if (disabled.length && withinBudget())
    await db.notificationInstallation.deleteMany({
      where: {
        id: { in: disabled.map((r) => r.id) },
        enabled: false,
        updatedAt: { lt: cutoff },
        deliveries: { none: {} },
      },
    });
}
