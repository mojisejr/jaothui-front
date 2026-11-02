import { PrismaClient } from "@prisma/client";
import { resolvePrismaDatabaseUrl } from "./prisma-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const runtimeUrl = resolvePrismaDatabaseUrl(process.env.DATABASE_URL, process.cwd());

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(runtimeUrl ? { datasources: { db: { url: runtimeUrl } } } : {}),
    // Prisma errors/queries can embed auth arguments and personal data.
    // Application auth boundaries emit allowlisted categories/stages instead.
    log: [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
