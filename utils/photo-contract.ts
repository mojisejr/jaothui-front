/** Browser-safe transport contract; server-only URL hashing stays out of bundles. */
export type PhotoSelector = { tokenIds: string[] } | { microchips: string[] };
// These active photo surfaces refresh just their image map on return. Do not
// simultaneously refetch heavy business/certificate/ownership metadata.
export const PHOTO_METADATA_QUERY_POLICY = { refetchOnWindowFocus: false, refetchOnReconnect: false };
export interface PhotoResult {
  tokenId: string;
  microchip?: string;
  status: "ready" | "fallback" | "unavailable";
  imageUrl?: string;
  sourceKey?: string;
  reason?: string;
}
export function validPhotoToken(value: unknown): value is string {
  return typeof value === "string" && /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= BigInt("9223372036854775807");
}
export function parsePhotoSelector(input: unknown): PhotoSelector {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== 1) throw new Error("INVALID_PHOTO_IDENTITIES");
  const body = input as Record<string, unknown>;
  const field = Object.prototype.hasOwnProperty.call(body, "tokenIds") ? "tokenIds" : "microchips";
  const values = body[field];
  if (!Array.isArray(values) || !values.length || values.length > 40 || !values.every((v) =>
    field === "tokenIds" ? validPhotoToken(v) : typeof v === "string" && /^[0-9]{1,32}$/.test(v))) throw new Error("INVALID_PHOTO_IDENTITIES");
  const sorted = [...new Set(values as string[])].sort();
  return field === "tokenIds" ? { tokenIds: sorted } : { microchips: sorted };
}
export function approvedPhotoResponseUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2600 || /[\\\s#]/.test(value)) return false;
  const prefix = "https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/";
  if (!value.startsWith(prefix)) return false;
  try {
    const parts = value.slice(prefix.length).split("?")[0].split("/").map(decodeURIComponent);
    if (parts.some((part) => !part || part === "." || part === ".." || /[\\/%\x00-\x1f\x7f]/.test(part))) return false;
    if (parts[0] !== "buffalo" && !(parts.length === 4 && parts[0] === "operations" &&
      /^[a-f0-9]{64}$/.test(parts[1]) && /^[a-f0-9-]{36}$/.test(parts[2]) && /^(source|published-image)\.jpg$/.test(parts[3]))) return false;
    if (!/\.(jpe?g|png|webp)$/i.test(parts[parts.length - 1]) || /\.(jpe?g|png|webp)\.(jpe?g|png|webp)$/i.test(parts[parts.length - 1])) return false;
    const url = new URL(value), seen = new Set<string>();
    if (url.search.length > 512) return false;
    let valid = true;
    url.searchParams.forEach((entry, key) => {
      if (!["cacheNonce", "v", "version"].includes(key) || seen.has(key) || !/^[a-zA-Z0-9._~-]{1,128}$/.test(entry)) valid = false;
      seen.add(key);
    });
    return valid;
  } catch { return false; }
}
