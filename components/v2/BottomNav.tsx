import Link from "next/link";
import { FiHome, FiGrid, FiUser, FiCreditCard } from "react-icons/fi";
import type { IconType } from "react-icons";
import { cn } from "./cn";

export type V2NavTab = "home" | "buffalo" | "profile" | "wallet";

interface TabDef {
  key: V2NavTab;
  label: string;
  href: string;
  Icon: IconType;
}

const DEFAULT_TABS: TabDef[] = [
  { key: "home", label: "Home", href: "/v2", Icon: FiHome },
  { key: "buffalo", label: "Buffalo", href: "/v2/buffalo", Icon: FiGrid },
  { key: "profile", label: "Profile", href: "/v2/profile", Icon: FiUser },
  { key: "wallet", label: "Wallet", href: "/v2/wallet", Icon: FiCreditCard },
];

/**
 * BottomNav — fixed 4-tab bottom navigation for the v2 shell. Active tab is gold.
 * NEW component (does not touch the legacy daisyUI btm-nav in components/Shared/Navbar).
 */
export interface BottomNavProps {
  active: V2NavTab;
  tabs?: TabDef[];
  className?: string;
}

export function BottomNav({ active, tabs = DEFAULT_TABS, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border-soft bg-surface pb-[env(safe-area-inset-bottom)] backdrop-blur-sm",
        className
      )}
    >
      {tabs.map(({ key, label, href, Icon }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
              isActive ? "text-accent" : "text-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_var(--accent-primary)]")} />
            <span className={isActive ? "font-semibold" : "font-normal"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
