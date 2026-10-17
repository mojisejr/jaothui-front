import { resolve } from "path";

export const BUNDLED_SUPABASE_CA = "certs/supabase-prod-ca-2021.crt";

/** Resolve only the explicitly selected public CA; never switch DB/role/mode. */
export function resolvePrismaDatabaseUrl(raw: string | undefined, projectRoot: string) {
  if (!raw) return undefined;
  let url: URL;
  try { url = new URL(raw); }
  catch { return raw; } // Let Prisma report invalid configuration; do not log it.
  if (
    (url.protocol !== "postgres:" && url.protocol !== "postgresql:") ||
    url.searchParams.get("sslcert") !== BUNDLED_SUPABASE_CA
  ) return raw;

  // Avoid platform/serverless working-directory differences in Prisma5's
  // certificate path resolution. The owner must still choose strict TLS in URL.
  url.searchParams.set("sslcert", resolve(projectRoot, "prisma", BUNDLED_SUPABASE_CA));
  return url.toString();
}
