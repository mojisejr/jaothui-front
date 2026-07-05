import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

/**
 * FilterChip — a horizontal-scroll filter pill (ทั้งหมด / Champion / Breeding / Verified / For Sale).
 * active = gold fill, inactive = surface + soft border.
 */
export const filterChipVariants = cva(
  "inline-flex shrink-0 items-center rounded-pill px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
  {
    variants: {
      active: {
        true: "bg-accent font-semibold text-background",
        false: "border border-border-soft bg-surface font-normal text-muted hover:text-foreground",
      },
    },
    defaultVariants: { active: false },
  }
);

export interface FilterChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">,
    VariantProps<typeof filterChipVariants> {
  className?: string;
}

export function FilterChip({ active, className, children, ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      className={cn(filterChipVariants({ active }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
