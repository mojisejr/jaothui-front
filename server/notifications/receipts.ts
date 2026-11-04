import type { PrismaClient } from "@prisma/client";
import type { RunReport } from "./contracts";
import { PushTransports } from "./transports";
export async function collectReceipts(
  db: PrismaClient,
  transport: PushTransports,
  now: Date,
  report: RunReport,
  withinBudget: () => boolean,
) {
  const rows = await db.notificationDelivery.findMany({
    where: { status: "submitted", receiptDueAt: { lte: now } },
    take: 100,
  });
  if (!rows.length) return;
  const ids = rows.map((r) => r.ticketId).filter((id): id is string => !!id),
    receipts = await transport.receipts(ids);
  for (const row of rows) {
    if (!withinBudget()) break;
    const receipt = receipts[row.ticketId ?? ""];
    if (!receipt && now.getTime() - row.createdAt.getTime() < 24 * 3600000) {
      await db.notificationDelivery.updateMany({
        where: { id: row.id, status: "submitted" },
        data: { receiptDueAt: new Date(now.getTime() + 5 * 60000) },
      });
      continue;
    }
    const status =
      receipt?.status === "ok"
        ? "accepted"
        : receipt
          ? "receipt_failed"
          : "receipt_unknown";
    await db.notificationDelivery.updateMany({
      where: { id: row.id, status: "submitted" },
      data: {
        status,
        lastError: receipt?.details?.error ?? null,
        receiptDueAt: null,
      },
    });
    if (receipt?.details?.error === "DeviceNotRegistered")
      await db.notificationInstallation.updateMany({
        where: { id: row.installationId, generation: row.generation },
        data: { enabled: false, generation: { increment: 1 } },
      });
    if (
      receipt?.details?.error === "InvalidCredentials" ||
      receipt?.details?.error === "MismatchSenderId"
    )
      await db.notificationScanState.upsert({
        where: { id: "transport:expo" },
        create: { id: "transport:expo", cursor: { paused: true } },
        update: { cursor: { paused: true } },
      });
    report.receipts++;
  }
}
