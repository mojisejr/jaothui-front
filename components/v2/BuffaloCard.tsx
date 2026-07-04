import type { ReactNode } from "react";
import { cn } from "./cn";
import { Badge } from "./Badge";

export type BuffaloStatus = "champion" | "breeding" | "verified" | "for-sale";

const STATUS_LABEL: Record<BuffaloStatus, string> = {
  champion: "Champion",
  breeding: "Breeding",
  verified: "Verified",
  "for-sale": "For Sale",
};

/**
 * BuffaloCard — a pedigree/NFT card: image, status badge, verified shield, name + chip + farm + owner.
 * Presentational only; the page wires real data (metadata.getAll) and the click target.
 */
export interface BuffaloCardProps {
  name: ReactNode;
  chip: ReactNode;
  farm?: ReactNode;
  owner?: ReactNode;
  status?: BuffaloStatus;
  verified?: boolean;
  /** image node (next/image or img) so the primitive stays framework-agnostic */
  image?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function BuffaloCard({
  name,
  chip,
  farm,
  owner,
  status = "champion",
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
        "group flex flex-col overflow-hidden rounded-card border border-border-soft bg-surface text-left shadow-gold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring active:scale-[0.99]",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-raised">
        {image}
        <span className="absolute left-3 top-3">
          <Badge variant={status} dot={status === "verified"}>
            {STATUS_LABEL[status]}
          </Badge>
        </span>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-foreground">{name}</h3>
          {verified && (
            <span aria-label="verified" className="text-success" title="Verified">
              &#10004;
            </span>
          )}
        </div>
        <p className="text-xs text-muted">CHIP : {chip}</p>
        {farm && <p className="text-xs text-muted">ฟาร์ม : {farm}</p>}
        {owner && <p className="text-xs text-muted">เจ้าของ : {owner}</p>}
      </div>
    </button>
  );
}
