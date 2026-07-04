import type { ReactNode } from "react";
import { FiCamera } from "react-icons/fi";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

/**
 * Avatar — profile image inside a white→gold gradient ring (premium). Optional camera button
 * (edit) and verified check. The gradient ring is the `--gradient-ring` token; the inner gap
 * is the dark surface so the ring reads as a thin premium border.
 */
export const avatarVariants = cva("relative shrink-0", {
  variants: {
    size: {
      md: "h-20 w-20",
      lg: "h-24 w-24",
      xl: "h-28 w-28",
    },
  },
  defaultVariants: { size: "lg" },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** image node (next/image or img); falls back to a surface circle */
  image?: ReactNode;
  onEdit?: () => void;
  className?: string;
}

export function Avatar({ size, image, onEdit, className }: AvatarProps) {
  return (
    <div className={cn(avatarVariants({ size }), className)}>
      {/* gradient ring */}
      <div className="h-full w-full rounded-pill bg-gradient-ring p-[2px]">
        {/* dark gap */}
        <div className="h-full w-full rounded-pill bg-background p-1">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-pill bg-surface">
            {image}
          </div>
        </div>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="เปลี่ยนรูป"
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-pill border border-border-soft bg-surface-raised text-foreground shadow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <FiCamera className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
