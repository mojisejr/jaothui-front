import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn } from "./cn";

/**
 * Pagination — v2 pager re-skinned from the real /cert index quick-jump.
 * Renders prev/next + a windowed page list with an ellipsis. Controlled via `page`/`onChange`.
 */
export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const items = pageWindow(page, totalPages);

  const arrow =
    "flex h-9 w-9 items-center justify-center rounded-pill border border-border-soft text-muted transition-colors hover:text-accent disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        aria-label="ก่อนหน้า"
        className={arrow}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <FiChevronLeft className="h-4 w-4" />
      </button>

      {items.map((it, i) =>
        it === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            aria-current={it === page ? "page" : undefined}
            onClick={() => onChange(it)}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-pill px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              it === page
                ? "bg-accent text-background"
                : "border border-border-soft text-muted hover:text-accent"
            )}
          >
            {it}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="ถัดไป"
        className={arrow}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <FiChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
