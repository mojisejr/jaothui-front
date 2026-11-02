import { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/router";
import { photoCoordinator, photoIdentityKey, type PhotoIdentity } from "../../utils/photo-coordinator";

export function PhotoRefreshLifecycle() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { void photoCoordinator.refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    router.events.on("routeChangeComplete", refresh);
    return () => {
      window.removeEventListener("focus", refresh); window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh); router.events.off("routeChangeComplete", refresh);
    };
  }, [router.events]);
  return null;
}

export function usePublishedPhoto(identity: PhotoIdentity, src?: string | null, stale = false) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [, rerender] = useReducer((value: number) => value + 1, 0);
  const key = photoIdentityKey(identity);
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent || !key) return;
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(parent);
    return () => observer.disconnect();
  }, [key]);
  useEffect(() => {
    if (!key || !visible) return;
    const unregister = photoCoordinator.register(key, src ?? undefined, stale, rerender, identity.photoTokenId);
    rerender();
    return unregister;
  }, [key, src, stale, visible, identity.photoTokenId]);
  const entry = key ? photoCoordinator.get(key) : undefined;
  return { ref, visible, identityKey: key, imageUrl: entry?.imageUrl ?? src, attempt: entry?.attempt ?? 0 };
}

export function PhotoRefreshButton() {
  const [, rerender] = useReducer((value: number) => value + 1, 0);
  useEffect(() => photoCoordinator.subscribe(rerender), []);
  const busy = photoCoordinator.status === "refreshing";
  const [message, setMessage] = useState("");
  return <span className="inline-flex flex-col items-start">
    <button type="button" disabled={busy} aria-busy={busy} className="min-h-[44px] rounded-pill px-3 text-sm text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-60"
      onClick={async () => {
        await photoCoordinator.refresh(true);
        setMessage(photoCoordinator.status === "unavailable" ? "ยังรีเฟรชไม่ได้ แสดงภาพล่าสุดที่โหลดสำเร็จ" : "ตรวจสอบภาพแล้ว ภาพใหม่จะแสดงเมื่อโหลดสำเร็จ");
      }}>{busy ? "กำลังตรวจสอบภาพ…" : "รีเฟรชภาพ"}</button>
    <span role="status" aria-live="polite" className="sr-only">{message}</span>
  </span>;
}
