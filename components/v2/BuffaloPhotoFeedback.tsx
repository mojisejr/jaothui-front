import { createContext, useContext, useState, type ReactNode } from "react";
import { Spinner } from "./Spinner";

export type PhotoFeedbackState = { busy: boolean; failed: boolean; hasGood: boolean; alt: string; retry: () => void };
export const PhotoFeedbackReport = createContext<((state: PhotoFeedbackState) => void) | null>(null);
const PhotoFeedbackStateContext = createContext<PhotoFeedbackState | null>(null);

/** Scoped to one card: relocating feedback never relocates its Image/state. */
export function BuffaloPhotoFeedback({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PhotoFeedbackState | null>(null);
  return <PhotoFeedbackReport.Provider value={setState}><PhotoFeedbackStateContext.Provider value={state}>{children}</PhotoFeedbackStateContext.Provider></PhotoFeedbackReport.Provider>;
}

export function BuffaloPhotoStatus({ leading }: { leading?: ReactNode }) {
  const state = useContext(PhotoFeedbackStateContext);
  return <div data-card-photo-footer className="flex h-11 min-h-[44px] min-w-0 items-center gap-1">
    {leading && <div data-photo-footer-leading className="max-w-[32%] min-w-0 shrink-0 break-words leading-[14px]">{leading}</div>}
    <div className="min-w-0 flex-1"><PhotoFeedback state={state} compact /></div>
  </div>;
}

export function PhotoFeedback({ state, compact = false, thumbnail = false }: { state: PhotoFeedbackState | null; compact?: boolean; thumbnail?: boolean }) {
  return <div data-photo-feedback className={compact ? "relative flex h-11 min-h-[44px] min-w-0 items-center justify-end gap-1 text-xs leading-4 text-muted" : "relative flex h-11 min-w-0 items-center justify-center gap-1 text-xs text-muted"}>
    {state?.hasGood && state.busy && <><Spinner decorative size="sm" className="h-4 w-4 shrink-0 motion-reduce:animate-none" />{!thumbnail && <span className="min-w-0 break-words">{compact ? "อัปเดตภาพ…" : "กำลังอัปเดตภาพ…"}</span>}</>}
    {state?.hasGood && state.failed && !thumbnail && <span className="min-w-0 break-words">{compact ? "อัปเดตไม่ได้" : "ยังอัปเดตไม่ได้"}</span>}
    {state?.failed && <button type="button" aria-label={`ลองโหลดภาพ${state.alt}อีกครั้ง`}
      className="relative z-20 min-h-[44px] min-w-[44px] shrink-0 rounded px-1 font-medium text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); state.retry(); }}>ลองใหม่</button>}
  </div>;
}
