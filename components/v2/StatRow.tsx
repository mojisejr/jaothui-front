import type { ReactNode } from "react";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { cn } from "./cn";

/**
 * StatRow — one labelled fact in the buffalo detail info card (อายุ, Signature ID, เพศ, …).
 * Left = icon + muted label; right = value. When `href` is set the whole row becomes a link
 * with a chevron (mother/father lineage, DNA doc, certificate). Replaces the 12 near-identical
 * daisyUI `.stat` blocks in the legacy ProfileBoxV2 with one composable v2 primitive.
 */
export interface StatRowProps {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  /** when set, the row is a link (internal via next/link, or external if `external`) */
  href?: string;
  external?: boolean;
  className?: string;
}

export function StatRow({ icon, label, value, href, external, className }: StatRowProps) {
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3 text-sm text-muted">
        {icon && <span className="shrink-0 text-accent">{icon}</span>}
        <span className="shrink-0">{label}</span>
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-right font-medium text-foreground">
        <span className="truncate">{value}</span>
        {href && <FiChevronRight className="h-4 w-4 shrink-0 text-muted" />}
      </span>
    </>
  );

  const base = "flex items-center justify-between gap-3 px-4 py-3.5";

  if (href) {
    return (
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cn(base, "transition-colors hover:bg-surface-raised", className)}
      >
        {content}
      </Link>
    );
  }
  return <div className={cn(base, className)}>{content}</div>;
}
