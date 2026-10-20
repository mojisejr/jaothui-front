import { createHash } from "node:crypto";

// Phase 1: pure, deliberately UNWIRED. No DB, Storage, draft ledger or clock access.
export const PHOTO_ORIGIN = "https://wtnqjxerhmdnqszkhbvs.supabase.co";
export const PHOTO_PUBLIC_PREFIX = "/storage/v1/object/public/slipstorage/";
export const MAX_PHOTO_IDENTITIES = 40;
const MAX_TOKEN = BigInt("9223372036854775807"); // existing PostgreSQL BigInt column
const allowedQuery = new Set(["cacheNonce", "v", "version"]);
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export interface PublishedPhotoRow {
  tokenId: string;
  image: string | null;
  /** Raw committed value; historical seconds/ms values are opaque, not parsed dates. */
  updatedAt: string;
}
export interface PhotoSource {
  tokenId: string;
  imageUrl: string;
  sourceKey: string;
  kind: "immutable-pointer" | "legacy-bootstrap";
  status: "ready" | "fallback";
}

export function isPhotoTokenId(value: unknown): value is string {
  return typeof value === "string" && /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= MAX_TOKEN;
}

/** Bound BEFORE dedup; transport byte limits remain a Phase 2 route responsibility. */
export function parsePhotoTokenIds(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length || value.length > MAX_PHOTO_IDENTITIES || !value.every(isPhotoTokenId)) {
    throw new Error("INVALID_PHOTO_IDENTITIES");
  }
  return [...new Set(value)].sort((a, b) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0);
}

/** Exact public bucket + identity image subtrees, never an arbitrary URL fetcher. */
export function normalizePublishedPhotoUrl(value: string | null): { url: URL; immutable: boolean } | null {
  if (typeof value !== "string" || !value || value.length > 2048 || value !== value.trim() || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    // Validate spelling before URL normalizes dot segments, backslashes or :443.
    if (!value.startsWith(`${PHOTO_ORIGIN}${PHOTO_PUBLIC_PREFIX}`)) return null;
    const url = new URL(value);
    if (url.origin !== PHOTO_ORIGIN || url.username || url.password || url.port || url.hash) return null;
    const rawPath = value.slice(PHOTO_ORIGIN.length).split(/[?#]/, 1)[0];
    const segments = rawPath.slice(PHOTO_PUBLIC_PREFIX.length).split("/").map((part) => decodeURIComponent(part));
    if (segments.some((part) => !/^[a-zA-Z0-9._ -]+$/.test(part) || part === "." || part === "..")) return null;
    // Encoded separators, repeated encodings and private roots cannot reach this point.
    const object = segments.join("/");
    const immutable = /^operations\/[0-9a-f]{64}\/[0-9a-f-]{36}\/(source|published-image)\.jpg$/.test(object);
    if (!immutable && !/^buffalo\/.+/.test(object)) return null;
    if (/\.jpg\.jpg$/i.test(object)) return null; // do not perpetuate a broken reader output
    const leaf = segments[segments.length - 1];
    if (!/\.(jpg|jpeg|png|webp)$/i.test(leaf)) {
      if (leaf.includes(".")) return null;
      segments[segments.length - 1] += ".jpg";
    }
    let validQuery = true;
    const seen = new Set<string>();
    url.searchParams.forEach((entry, key) => {
      if (!allowedQuery.has(key) || seen.has(key) || !/^[a-zA-Z0-9._~-]{1,128}$/.test(entry)) validQuery = false;
      seen.add(key);
    });
    if (!validQuery || url.search.length > 512) return null;
    url.pathname = PHOTO_PUBLIC_PREFIX + segments.map(encodeURIComponent).join("/");
    url.searchParams.sort();
    return { url, immutable };
  } catch {
    return null;
  }
}

/** Accept ONLY a committed public row. Draft operation objects are not inputs. */
export function resolvePublishedPhoto(row: PublishedPhotoRow): PhotoSource | null {
  if (!isPhotoTokenId(row.tokenId) || typeof row.updatedAt !== "string" || row.updatedAt.length > 128) return null;
  let normalized = normalizePublishedPhotoUrl(row.image);
  const aliasToken = normalized?.url.pathname.match(/\/buffalo\/([1-9][0-9]*)\.jpg$/i)?.[1];
  if (aliasToken && aliasToken !== row.tokenId) normalized = null;
  const url = normalized?.url ?? new URL(`${PHOTO_ORIGIN}${PHOTO_PUBLIC_PREFIX}buffalo/${row.tokenId}.jpg`);
  if (normalized?.immutable) {
    return { tokenId: row.tokenId, imageUrl: url.href, sourceKey: `photo-v1:${digest(url.href)}`, kind: "immutable-pointer", status: "ready" };
  }
  // A bootstrap namespace, NOT a verified historical photo revision. Mutable aliases
  // may change before the writer's DB projection; this cannot guarantee atomic pixels.
  url.searchParams.delete("cacheNonce");
  const marker = digest(JSON.stringify([url.href, row.updatedAt]));
  url.searchParams.set("cacheNonce", `jaothui-photo-v1-${marker}`);
  url.searchParams.sort();
  return { tokenId: row.tokenId, imageUrl: url.href, sourceKey: `photo-v1:${digest(url.href)}`, kind: "legacy-bootstrap", status: normalized ? "ready" : "fallback" };
}

/** The future query must count ALL matching rows, not LIMIT 1 / arbitrary findFirst. */
export interface PublishedPhotoGroup {
  tokenId: string;
  rowCount: number;
  row?: PublishedPhotoRow;
}
export type PhotoGroupResult = PhotoSource | { tokenId: string; status: "unavailable"; reason: "missing" | "ambiguous" | "invalid-row" };

/** Consumes at most one bounded aggregate per requested identity, never all duplicate rows. */
export function resolvePhotoGroups(ids: string[], groups: PublishedPhotoGroup[]): PhotoGroupResult[] {
  const requested = parsePhotoTokenIds(ids);
  if (groups.length > MAX_PHOTO_IDENTITIES || groups.some((group) => !requested.includes(group.tokenId))) throw new Error("INVALID_PHOTO_GROUPS");
  return requested.map((tokenId) => {
    const matches = groups.filter((group) => group.tokenId === tokenId);
    if (!matches.length) return { tokenId, status: "unavailable", reason: "missing" };
    const group = matches[0];
    if (matches.length !== 1 || !Number.isSafeInteger(group.rowCount) || group.rowCount !== 1) return { tokenId, status: "unavailable", reason: "ambiguous" };
    const source = group.row?.tokenId === tokenId ? resolvePublishedPhoto(group.row) : null;
    return source ?? { tokenId, status: "unavailable", reason: "invalid-row" };
  });
}
