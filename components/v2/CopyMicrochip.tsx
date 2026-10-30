import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import { cn } from "./cn";

interface CopyMicrochipProps {
  /** The original identifier, never a formatted label or a numeric conversion. */
  value?: string | null;
  className?: string;
}

export function CopyMicrochip({ value, className }: CopyMicrochipProps) {
  if (!value || value === "N/A") return <span>{value || "N/A"}</span>;
  return <CopyValue key={value} value={value} className={className} />;
}

function CopyValue({ value, className }: { value: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "copied" | "failed">("idle");
  const pending = useRef(false);
  const mounted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);

  async function copy() {
    if (pending.current) return;
    pending.current = true;
    clearTimeout(timer.current);
    setStatus("pending");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("CLIPBOARD_UNAVAILABLE");
      await navigator.clipboard.writeText(value);
      if (!mounted.current) return;
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 1800);
    } catch {
      if (mounted.current) setStatus("failed");
    } finally {
      pending.current = false;
    }
  }

  const feedback = status === "copied" ? "คัดลอกแล้ว" : status === "failed" ? "คัดลอกไม่สำเร็จ" : "";
  return (
    <span className={cn("relative inline-flex min-w-0 max-w-full align-middle", className)}>
      <button
        type="button"
        aria-label={`คัดลอกเลขไมโครชิป ${value}`}
        title={status === "failed" ? "ลองอีกครั้ง หรือเลือกเลขเพื่อคัดลอกด้วยตนเอง" : "คัดลอกเลขไมโครชิป"}
        disabled={status === "pending"}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); void copy(); }}
        className="flex min-h-[44px] min-w-[44px] max-w-full items-center gap-1.5 rounded-md pb-3 text-left text-inherit transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-60"
      >
        <span className="min-w-0 select-text truncate tabular-nums">{value}</span>
        {status === "copied" ? <FiCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-success" /> : <FiCopy aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
      </button>
      <span role="status" aria-live="polite" aria-atomic="true" className={cn("pointer-events-none absolute bottom-0 left-0 whitespace-nowrap text-[10px] leading-3", status === "failed" ? "text-error" : "text-success")}>
        {feedback}
      </span>
    </span>
  );
}
