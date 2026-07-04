import type { ReactNode } from "react";
import { cn } from "./cn";
import { Badge } from "./Badge";
import { Button } from "./Button";

/**
 * WalletCard — profile wallet status panel. connected = shows provider + address + green
 * "Connected"; disconnected = shows a connect CTA. Wraps whatever auth the page passes in
 * (in jaothui: useBitkubNext()); the primitive itself is presentational.
 */
export interface WalletCardProps {
  connected?: boolean;
  provider?: ReactNode;
  address?: ReactNode;
  /** provider logo node (e.g. next/image of bitkubLogo) */
  logo?: ReactNode;
  onConnect?: () => void;
  onOpen?: () => void;
  className?: string;
}

export function WalletCard({
  connected,
  provider = "Bitkub NEXT",
  address,
  logo,
  onConnect,
  onOpen,
  className,
}: WalletCardProps) {
  return (
    <section
      className={cn(
        "rounded-card border border-border-soft bg-surface p-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-accent">Wallet Status</p>
        {connected ? (
          <Badge variant="verified" dot>
            Connected
          </Badge>
        ) : (
          <Badge variant="for-sale">Disconnected</Badge>
        )}
      </div>

      {connected ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {logo && <span className="shrink-0">{logo}</span>}
            <div>
              <p className="font-bold text-foreground">{provider}</p>
              {address && <p className="text-sm text-muted">{address}</p>}
            </div>
          </div>
          {onOpen && (
            <Button variant="gold-outline" size="sm" onClick={onOpen}>
              เปิด
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <Button variant="gold-fill" block onClick={onConnect}>
            เชื่อมต่อ {provider}
          </Button>
        </div>
      )}
    </section>
  );
}
