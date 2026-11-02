import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * StatCard — a single metric tile (gold value + muted label) on a dark surface.
 * Used in the Home hero stat grid (เกษตรกร / กระบือ / กิจกรรม / ยืนยันแล้ว).
 */
export interface StatCardProps {
  value: ReactNode;
  label: ReactNode;
  /** optional leading icon */
  icon?: ReactNode;
  /** optional suffix under the value (e.g. "ราย", "ตัว") */
  unit?: ReactNode;
  /** Stable authoritative metric for assistive reading, never frame-by-frame. */
  accessibleValue?: string;
  className?: string;
}

export function StatCard({ value, label, icon, unit, accessibleValue, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-card border border-border-soft bg-surface p-4",
        className
      )}
    >
      {icon && <div className="text-accent">{icon}</div>}
      <p className="text-2xl font-bold text-accent">
        {accessibleValue && <span className="sr-only">{accessibleValue}</span>}
        <span aria-hidden={accessibleValue ? true : undefined}>
          {value}
          {unit && <span className="ml-1 text-sm font-medium text-muted">{unit}</span>}
        </span>
      </p>
      <p className="text-sm font-normal text-muted">{label}</p>
    </div>
  );
}
