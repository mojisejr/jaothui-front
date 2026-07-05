import type { ReactNode } from "react";
import { FiChevronRight } from "react-icons/fi";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

/**
 * SettingsRow — one row in the profile settings list (แก้ไขโปรไฟล์, ข้อมูลฟาร์ม, ...).
 * default = neutral row with chevron; danger = red (ออกจากระบบ). Optional right slot
 * replaces the chevron (e.g. a Dark/Light toggle or a value label).
 */
export const settingsRowVariants = cva(
  "flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent",
  {
    variants: {
      variant: {
        default: "text-foreground hover:bg-surface-raised",
        danger: "font-semibold text-danger hover:bg-surface-raised",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface SettingsRowProps extends VariantProps<typeof settingsRowVariants> {
  label: ReactNode;
  icon?: ReactNode;
  /** right-side content; when omitted a chevron is shown (except danger) */
  right?: ReactNode;
  onClick?: () => void;
  /** dim + block the row (feature not shipped yet — pair with a "เร็วๆ นี้" right slot) */
  disabled?: boolean;
  className?: string;
}

export function SettingsRow({
  variant = "default",
  label,
  icon,
  right,
  onClick,
  disabled,
  className,
}: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(settingsRowVariants({ variant }), className)}
    >
      <span className="flex items-center gap-3">
        {icon && <span className="text-muted">{icon}</span>}
        <span>{label}</span>
      </span>
      {right ?? (variant === "default" ? <FiChevronRight className="h-5 w-5 text-muted" /> : null)}
    </button>
  );
}
