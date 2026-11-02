import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

/**
 * V2Button — the v2 (dark-gold-green) action primitive.
 * gold-fill = solid gold on black text · gold-outline = gold hairline + gold text.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-card font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        "gold-fill": "bg-accent text-background hover:bg-accent-hover",
        "gold-gradient":
          "bg-gradient-gold text-background shadow-gold hover:brightness-105",
        "gold-outline":
          "border border-accent bg-transparent text-accent hover:bg-accent hover:text-background",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-12 px-5 text-base",
        lg: "h-14 px-6 text-lg",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "gold-fill",
      size: "md",
      block: false,
    },
  }
);

export interface V2ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, V2ButtonProps>(
  ({ className, variant, size, block, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-pill border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
);
Button.displayName = "V2Button";
