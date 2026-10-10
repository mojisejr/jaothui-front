import type { ReactNode } from "react";
import { cn } from "./cn";
import { formatBuffaloAge } from "./formatAge";

/**
 * BuffaloCard — a pedigree card re-skinned from the real `/cert` PedigreeCard.
 * Body badge shows the REAL age (human-readable months), never over the photograph.
 * Body = name · microchip · birthdate. Presentational only; the page wires real data
 * (metadata.getBatch / getAll → real Supabase image) and the click target.
 */
export interface BuffaloCardProps {
  name: ReactNode;
  /** microchip id */
  chip: ReactNode;
  /** Thai birthdate string (already formatted) */
  birthdate?: ReactNode;
  /** real age in months (calculatedAge) → rendered in the information area */
  ageMonths?: number | null;
  verified?: boolean;
  /** image node (next/image or img) so the primitive stays framework-agnostic */
  image?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function BuffaloCard({
  name,
  chip,
  birthdate,
  ageMonths,
  verified,
  image,
  onClick,
  className,
}: BuffaloCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-photo border border-photo-hairline bg-surface text-left transition-[transform,border-color] hover:border-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring active:scale-[0.99]",
        className
      )}
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface">
        {image}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-bold text-foreground">{name}</h3>
          {verified && (
            <span aria-label="verified" className="shrink-0 text-success" title="Verified">
              &#10004;
            </span>
          )}
        </div>
        {/* microchip: no "CHIP" label so the full number stays on one line */}
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs tabular-nums text-muted">
          {chip}
        </p>
        {birthdate && <p className="text-xs text-muted">วันเกิด : {birthdate}</p>}
        <span className="mt-1 self-start text-[11px] font-semibold text-accent">
          {formatBuffaloAge(ageMonths)}
        </span>
      </div>
    </button>
  );
}
