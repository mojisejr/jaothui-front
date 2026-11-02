import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

/**
 * Badge — buffalo status pill. champion=gold, breeding=blue(info), verified=green(success),
 * for-sale=neutral. Tinted fills over the dark surface, not solid blocks.
 */
export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        champion: "bg-accent-soft text-accent",
        breeding: "bg-info-soft text-info",
        verified: "bg-success-soft text-success",
        "for-sale": "bg-surface-raised text-muted",
      },
    },
    defaultVariants: { variant: "champion" },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** show a leading status dot (used by verified/breeding) */
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-current" />}
      {children}
    </span>
  );
}
