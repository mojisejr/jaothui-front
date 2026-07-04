import type { ReactNode } from "react";
import { cn } from "./cn";
import { BottomNav, type V2NavTab } from "./BottomNav";

/**
 * V2Layout — the dark-gold-green app shell for v2 routes (/v2/*).
 * A NEW, parallel layout: it does NOT touch the legacy components/Layouts or the daisyUI
 * shell. Provides the near-black canvas, a subtle gold atmospheric glow (so #070707 isn't a
 * flat void), and the fixed BottomNav with bottom padding to clear it.
 */
export interface V2LayoutProps {
  children: ReactNode;
  /** which bottom-nav tab is active; omit to hide the nav (e.g. detail pages) */
  activeTab?: V2NavTab;
  className?: string;
  /** hide the bottom nav entirely */
  hideNav?: boolean;
}

export function V2Layout({ children, activeTab = "home", className, hideNav }: V2LayoutProps) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* atmospheric gold glow — decorative, non-interactive */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, rgba(214,177,95,0.10), transparent 70%), radial-gradient(40% 30% at 90% 20%, rgba(91,141,239,0.06), transparent 70%)",
        }}
      />
      <main className={cn("relative z-10 mx-auto w-full max-w-screen-sm", !hideNav && "pb-24", className)}>
        {children}
      </main>
      {!hideNav && <BottomNav active={activeTab} />}
    </div>
  );
}
