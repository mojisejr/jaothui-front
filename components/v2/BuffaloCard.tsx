import type { ReactNode } from "react";
import { cn } from "./cn";
import { formatBuffaloAge } from "./formatAge";
import { BuffaloSex } from "./BuffaloSex";
import { BuffaloPhotoFeedback, BuffaloPhotoStatus } from "./BuffaloPhotoFeedback";

/**
 * BuffaloCard — a pedigree card re-skinned from the real `/cert` PedigreeCard.
 * Body badge shows the REAL age (human-readable months), never over the photograph.
 * Body = name · microchip · birthdate. Presentational only; the page wires real data
 * (metadata.getBatch / getAll → real Supabase image) and the click target.
 */
export interface BuffaloCardProps {
  name: ReactNode;
  sex?: string | null;
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
  sex,
  chip,
  birthdate,
  ageMonths,
  verified,
  image,
  onClick,
  className,
}: BuffaloCardProps) {
  return (
    <BuffaloPhotoFeedback key={typeof chip === "string" || typeof chip === "number" ? chip : undefined}><div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-photo border border-photo-hairline bg-surface text-left transition-[transform,border-color] hover:border-border-soft focus-within:ring-2 focus-within:ring-focus-ring active:scale-[0.99]",
        className
      )}
    >
      {onClick && <button type="button" onClick={onClick} aria-label={`ดูรายละเอียด ${typeof name === "string" ? name : chip}`}
        className="absolute inset-0 z-10 rounded-photo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" />}
      <div className="w-full bg-surface">
        {image}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div data-card-title className="flex min-w-0 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <h3 className="min-w-0 line-clamp-2 break-words text-base font-bold leading-6 text-foreground">{name}</h3>
          {verified && (
            <span aria-label="verified" className="shrink-0 text-success" title="Verified">
              &#10004;
            </span>
          )}
          </div><BuffaloSex value={sex} />
        </div>
        {/* microchip: no "CHIP" label so the full number stays on one line */}
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs tabular-nums text-muted">
          {chip}
        </p>
        {birthdate && <p className="text-xs text-muted">วันเกิด : {birthdate}</p>}
        <BuffaloPhotoStatus leading={<span className="self-center text-[11px] font-semibold text-accent">
          {formatBuffaloAge(ageMonths)}
        </span>} />
      </div>
    </div></BuffaloPhotoFeedback>
  );
}
