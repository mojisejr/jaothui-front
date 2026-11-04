import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";
import {
  digest,
  installationInput,
  PushError,
  targetFor,
  targetHash,
} from "./contracts";

export async function registerInstallation(
  db: PrismaClient,
  accountId: string,
  raw: unknown,
) {
  const parsed = installationInput.safeParse(raw);
  if (!parsed.success) throw new PushError(400, "INVALID_INSTALLATION");
  const input = parsed.data,
    target = targetFor(input),
    hash = targetHash(target);
  const secret = randomBytes(32).toString("base64url");
  try {
    const row = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.installationId},0))::text`;
      await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id"=${accountId} FOR UPDATE`;
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (
        !account ||
        account.status !== "ACTIVE" ||
        account.deletedAt ||
        account.role === "REVIEWER_SANDBOX"
      )
        throw new PushError(403, "ACCOUNT_INACTIVE");
      const total = await tx.notificationInstallation.count({
        where: { accountId },
      });
      const recent = await tx.notificationInstallation.count({
        where: { accountId, updatedAt: { gt: new Date(Date.now() - 60000) } },
      });
      const prior = await tx.notificationInstallation.findUnique({
        where: { id: input.installationId },
      });
      if ((!prior && total >= 20) || recent >= 10)
        throw new PushError(429, "RATE_LIMITED");
      // Rebinding requires possession of the actual endpoint, not a guessed UUID.
      if (prior && prior.accountId !== accountId && prior.targetHash !== hash)
        throw new PushError(409, "INSTALLATION_CONFLICT");
      const duplicate = await tx.notificationInstallation.findUnique({
        where: { targetHash: hash },
      });
      if (duplicate && duplicate.id !== input.installationId)
        throw new PushError(409, "INSTALLATION_CONFLICT");
      if (prior && prior.updatedAt.getTime() > Date.now() - 1000)
        throw new PushError(429, "RATE_LIMITED");
      const generation = prior ? prior.generation + 1 : 1;
      return tx.notificationInstallation.upsert({
        where: { id: input.installationId },
        create: {
          id: input.installationId,
          accountId,
          platform: input.platform,
          target,
          targetHash: hash,
          revocationHash: digest(secret),
          generation,
        },
        update: {
          accountId,
          platform: input.platform,
          target,
          targetHash: hash,
          revocationHash: digest(secret),
          generation,
          enabled: true,
        },
      });
    });
    return {
      available: true,
      enabled: true,
      bindingGeneration: row.generation,
      revocationToken: `${row.generation}.${secret}`,
    };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002")
      throw new PushError(409, "INSTALLATION_CONFLICT");
    throw error;
  }
}
export async function disableInstallation(
  db: PrismaClient,
  accountId: string,
  id: string,
) {
  await db.notificationInstallation.updateMany({
    where: { id, accountId, enabled: true },
    data: { enabled: false, generation: { increment: 1 } },
  });
  return { enabled: false };
}
export async function revokeInstallation(
  db: PrismaClient,
  id: string,
  token: string,
) {
  const match = /^(\d{1,10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) throw new PushError(400, "INVALID_REVOCATION");
  await db.notificationInstallation.updateMany({
    where: {
      id,
      generation: Number(match[1]),
      revocationHash: digest(match[2]),
      enabled: true,
    },
    data: { enabled: false, generation: { increment: 1 } },
  });
  return { enabled: false }; // no ownership/status oracle for stale handles
}
