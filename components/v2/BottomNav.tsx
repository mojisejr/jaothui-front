import Link from "next/link";
import Image from "next/image";
import { FiHome, FiUser } from "react-icons/fi";
import type { IconType } from "react-icons";
import { cn } from "./cn";

// "wallet" stays in the union for forward-compat, but the Wallet tab is intentionally
// NOT shipped yet (no /v2/wallet route + undecided scope).
export type V2NavTab = "home" | "buffalo" | "profile" | "wallet";

interface SideTab {
  key: V2NavTab;
  label: string;
  href: string;
  Icon: IconType;
}

// Side tabs flank a raised center logo FAB (Buffalo) — the app's signature action.
const HOME_TAB: SideTab = { key: "home", label: "หน้าหลัก", href: "/v2", Icon: FiHome };
const PROFILE_TAB: SideTab = { key: "profile", label: "โปรไฟล์", href: "/v2/profile", Icon: FiUser };

export interface BottomNavProps {
  active: V2NavTab;
  className?: string;
}

function SideTabLink({ tab, active }: { tab: SideTab; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
        active ? "text-accent" : "text-muted hover:text-foreground"
      )}
    >
      <tab.Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_var(--accent-primary)]")} />
      <span className={active ? "font-semibold" : "font-normal"}>{tab.label}</span>
    </Link>
  );
}

/**
 * BottomNav — v2 (dark-gold-green) bottom navigation with a raised center logo FAB.
 * Layout = [Home] · [center logo → Buffalo] · [Profile]. The center FAB re-skins the legacy
 * daisyUI center-logo pattern (components/Shared/Navbar/Bottom.tsx) into the v2 theme: a dark
 * circle with a gold ring + glow so the gold buffalo-horn logo reads against #070707. NEW
 * component — does not touch the legacy nav. 3 live routes, no dead links (Wallet not shipped).
 */
export function BottomNav({ active, className }: BottomNavProps) {
  const buffaloActive = active === "buffalo";
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-surface pb-[env(safe-area-inset-bottom)] backdrop-blur-sm",
        className
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-screen-sm items-stretch">
        <SideTabLink tab={HOME_TAB} active={active === "home"} />

        {/* reserved gap for the floating FAB */}
        <div className="w-20 shrink-0" aria-hidden />

        <SideTabLink tab={PROFILE_TAB} active={active === "profile"} />

        {/* center logo FAB → Buffalo (the signature action) */}
        <Link
          href="/v2/buffalo"
          aria-label="เพชรดีกรี (ควาย)"
          aria-current={buffaloActive ? "page" : undefined}
          className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus-visible:outline-none"
        >
          <span
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-pill border bg-surface-raised transition-all",
              buffaloActive
                ? "border-accent shadow-gold ring-2 ring-accent"
                : "border-border-soft shadow-gold hover:border-accent"
            )}
          >
            <Image
              src="/images/thuiLogo.png"
              alt="เจ้าทุย"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          </span>
        </Link>
      </div>
    </nav>
  );
}
