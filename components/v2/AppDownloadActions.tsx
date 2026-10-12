import Link from "next/link";
import { useId, useRef, useState } from "react";
import { BsApple, BsGooglePlay } from "react-icons/bs";
import { FiArrowUpRight, FiShare2 } from "react-icons/fi";
import { DOWNLOAD_URL, STORE_URLS } from "../../utils/download-routing";
import { shareDownload } from "../../utils/share-download";
import { buttonVariants } from "./Button";
import { cn } from "./cn";

export function AppDownloadActions({ mode = "stores", onNavigate }: { mode?: "stores" | "automatic"; onNavigate?: () => void }) {
  const id = useId();
  const sharing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState(false);

  async function handleShare() {
    if (sharing.current) return;
    sharing.current = true;
    setBusy(true);
    setStatus("");
    const result = await shareDownload({
      share: navigator.share ? (data) => navigator.share(data) : undefined,
      copy: navigator.clipboard?.writeText ? (text) => navigator.clipboard.writeText(text) : undefined,
    });
    setManual(result === "manual");
    setStatus(result === "copied" ? "คัดลอกลิงก์แล้ว พร้อมส่งให้เพื่อน" : result === "shared" ? "แชร์ลิงก์แล้ว" : result === "manual" ? "เลือกลิงก์ด้านล่างเพื่อคัดลอกและส่งต่อ" : "");
    sharing.current = false;
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {mode === "automatic" ? (
          <Link href="/download" onClick={onNavigate} className={buttonVariants({ block: true })}>
            ดาวน์โหลดแอป <FiArrowUpRight aria-hidden className="shrink-0" />
          </Link>
        ) : (
          <div className="grid gap-3 mobileM:grid-cols-2">
            <a href={STORE_URLS.ios} onClick={onNavigate} className={cn(buttonVariants({ block: true }), "px-3 text-sm")}><BsApple aria-hidden className="h-5 w-5 shrink-0" /> App Store</a>
            <a href={STORE_URLS.android} onClick={onNavigate} className={cn(buttonVariants({ variant: "gold-outline", block: true }), "px-3 text-sm")}><BsGooglePlay aria-hidden className="h-4 w-4 shrink-0" /> Google Play</a>
          </div>
        )}
        <button type="button" onClick={handleShare} disabled={busy} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-card px-3 text-sm font-medium text-accent transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50">
          <FiShare2 aria-hidden /> {busy ? "กำลังเปิดการแชร์…" : "แชร์ลิงก์ดาวน์โหลด"}
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-center text-xs leading-6 text-muted">{status}</p>
      {manual ? (
        <div className="mt-2">
          <label htmlFor={id} className="block text-xs text-muted">ลิงก์ดาวน์โหลด</label>
          <input id={id} type="url" readOnly value={DOWNLOAD_URL} onFocus={(event) => event.currentTarget.select()} className="mt-1 min-h-[44px] w-full rounded-photo border border-border-soft bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" />
        </div>
      ) : null}
    </div>
  );
}
