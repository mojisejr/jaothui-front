import { forwardRef, type InputHTMLAttributes } from "react";
import { FiSearch } from "react-icons/fi";
import { cn } from "./cn";

/**
 * SearchInput — the buffalo search field (ค้นหาเลขชิป, ชื่อควาย, Certificate).
 * Dark surface, gold focus ring, leading search icon.
 */
export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <div className={cn("relative w-full", wrapperClassName)}>
      <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input
        ref={ref}
        type="search"
        className={cn(
          "w-full rounded-card border border-border-soft bg-surface py-4 pl-12 pr-4 text-foreground placeholder:text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          className
        )}
        {...props}
      />
    </div>
  )
);
SearchInput.displayName = "SearchInput";
