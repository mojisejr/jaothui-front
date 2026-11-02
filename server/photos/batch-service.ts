import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { parsePhotoTokenIds, resolvePhotoGroups } from "./source-contract";
import { resolvePublishedPhoto } from "./source-contract";
import { parsePhotoSelector, type PhotoSelector, type PhotoResult } from "../../utils/photo-contract";

export const PHOTO_CACHE_MS = 5000;
export const PHOTO_QUERY_TIMEOUT_MS = 3000;
const MAX_CACHE_KEYS = 64;
const MAX_ACTIVE_BATCHES = 4;
type Group = { tokenId: string; rowCount: number; image: string | null; updatedAt: string | null };

/** COUNT precedes projection: duplicate token IDs cannot choose another animal's photo. */
export function photoGroupQuery(ids: string[]) {
  const tokens = parsePhotoTokenIds(ids).map((id) => BigInt(id));
  return Prisma.sql`SELECT "tokenId"::text AS "tokenId", COUNT(*)::int AS "rowCount",
    CASE WHEN COUNT(*) = 1 THEN MIN("image") ELSE NULL END AS "image",
    CASE WHEN COUNT(*) = 1 THEN MIN("updatedAt") ELSE NULL END AS "updatedAt"
    FROM "Pedigree" WHERE "tokenId" IN (${Prisma.join(tokens)})
    GROUP BY "tokenId" ORDER BY "tokenId" LIMIT 40`;
}

export async function queryPublishedPhotos(input: PhotoSelector): Promise<PhotoResult[]> {
  const selector = parsePhotoSelector(input);
  // SET LOCAL gives the query a real database cancellation limit; Promise.race alone
  // would leave an expensive query holding the existing shared pool connection.
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    await tx.$executeRaw`SET LOCAL statement_timeout = '2500ms'`;
    if ("microchips" in selector) {
      const rows = await tx.$queryRaw<{ microchip: string; tokenId: string; image: string | null; updatedAt: string }[]>(Prisma.sql`
        SELECT "microchip", "tokenId"::text AS "tokenId", "image", "updatedAt" FROM "Pedigree"
        WHERE "microchip" IN (${Prisma.join(selector.microchips)}) ORDER BY "microchip" LIMIT 40`);
      return selector.microchips.map((microchip) => {
        const matches = rows.filter((row) => row.microchip === microchip);
        const row = matches.length === 1 ? matches[0] : undefined;
        const source = row ? resolvePublishedPhoto(row) : null;
        return source ? { ...source, microchip } : { microchip, tokenId: "", status: "unavailable" as const, reason: "missing" };
      });
    }
    const requested = parsePhotoTokenIds(selector.tokenIds);
    const groups = await tx.$queryRaw<Group[]>(photoGroupQuery(requested));
    return resolvePhotoGroups(requested, groups.map((group) => ({
      tokenId: group.tokenId, rowCount: group.rowCount,
      row: group.updatedAt === null ? undefined : { tokenId: group.tokenId, image: group.image, updatedAt: group.updatedAt },
    })));
  }, { maxWait: 1000, timeout: PHOTO_QUERY_TIMEOUT_MS });
}

/** Instance-local safety budget; no new DB pool or durable/cache infrastructure. */
export function createPhotoBatchReader(
  query: (ids: PhotoSelector) => Promise<PhotoResult[]> = queryPublishedPhotos,
  now = Date.now,
) {
  const cache = new Map<string, { at: number; photos: PhotoResult[] }>();
  const active = new Map<string, Promise<PhotoResult[]>>();
  let windowAt = now(), windowCount = 0;
  return async (input: unknown): Promise<PhotoResult[]> => {
    const ids = parsePhotoSelector(input), key = JSON.stringify(ids);
    const cached = cache.get(key);
    if (cached && now() - cached.at < PHOTO_CACHE_MS) return cached.photos;
    const pending = active.get(key);
    if (pending) return pending;
    if (now() - windowAt >= 1000) { windowAt = now(); windowCount = 0; }
    if (active.size >= MAX_ACTIVE_BATCHES || windowCount >= 20) throw new Error("PHOTO_BUSY");
    windowCount++;
    const task = query(ids).then((photos) => {
      if (cache.size >= MAX_CACHE_KEYS) cache.delete(cache.keys().next().value!);
      cache.set(key, { at: now(), photos });
      return photos;
    }).finally(() => active.delete(key));
    active.set(key, task);
    return task;
  };
}

export const readPublishedPhotos = createPhotoBatchReader();
