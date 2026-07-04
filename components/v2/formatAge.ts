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
