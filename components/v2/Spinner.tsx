import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

/**
 * Spinner — the v2 (dark-gold) loading indicator. A gold ring with a transparent top that
 * spins. Replaces the legacy daisyUI `loading-infinity` on v2 surfaces WITHOUT touching the
 * shared `components/Shared/Indicators/Loading.tsx` (which 20+ legacy screens still use).
 */
export const spinnerVariants = cva(
  "inline-block animate-spin rounded-pill border-accent border-t-transparent",
  {
    variants: {
      size: {
        sm: "h-5 w-5 border-2",
        md: "h-8 w-8 border-[3px]",
        lg: "h-12 w-12 border-4",
      },
    },
    defaultVariants: { size: "md" },
  }
);

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
  /** accessible label; defaults to "กำลังโหลด" */
  label?: string;
}

export function Spinner({ size, className, label = "กำลังโหลด" }: SpinnerProps) {
  return <span role="status" aria-label={label} className={cn(spinnerVariants({ size }), className)} />;
}
