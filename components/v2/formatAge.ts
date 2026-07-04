import { parseThaiDate } from "../../helpers/parseThaiDate";

/**
 * formatBuffaloAge — human-readable Thai age from a month count (real `calculatedAge`).
 * Under one month reads "น้อยกว่าหนึ่งเดือน"; otherwise "{n} เดือน".
 * Always months (no year rollup) — matches the legacy PedigreeCard convention.
 */
export function formatBuffaloAge(months: number | null | undefined): string {
  const n = typeof months === "number" && Number.isFinite(months) ? Math.floor(months) : 0;
  if (n < 1) return "น้อยกว่าหนึ่งเดือน";
  return `${n} เดือน`;
}

/**
 * formatThaiBirthdate — abbreviated Thai birthdate ("9 ก.ย. 2560") from an epoch (ms).
 * Reuses the legacy `parseThaiDate` so v2 cards match the existing /cert convention.
 */
export function formatThaiBirthdate(epochMs: number | null | undefined): string {
  if (typeof epochMs !== "number" || epochMs <= 0) return "N/A";
  const d = parseThaiDate(epochMs);
  return `${d.date} ${d.thaiMonth2} ${d.thaiYear}`;
}
