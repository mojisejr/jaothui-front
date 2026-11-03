import Link from "next/link";
import { FiPause, FiPlay } from "react-icons/fi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import { LiquidPagination } from "./LiquidPagination";
import { EventPreviewCard } from "./EventPreviewCard";
import { fetchWebEvents, type WebEventPage } from "../../utils/web-events";

export function HomeEventZone() {
  const [page, setPage] = useState<WebEventPage | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [drag, setDrag] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [modal, setModal] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => page?.items.slice(0, 5) ?? [], [page]);
  const previousItems = useRef(items);
  const motionFrame = useRef(0);
  const restoreSnap = useRef<(() => void) | null>(null);
  const automaticMotion = useRef(false);
  const stopMotion = useCallback(() => {
    if (motionFrame.current) window.cancelAnimationFrame(motionFrame.current);
    motionFrame.current = 0;
    restoreSnap.current?.();
    restoreSnap.current = null;
    automaticMotion.current = false;
  }, []);
  const syncSelection = useCallback((rail: HTMLDivElement) => {
    if (!rail.clientWidth || !items.length) return;
    const index = Math.max(0, Math.min(items.length - 1, Math.round(rail.scrollLeft / rail.clientWidth)));
    // Semantic selection follows the real rail, including before the first animation frame.
    setSelectedId(items[index].id);
  }, [items]);
  const scrollToEvent = useCallback((index: number, animate: boolean, automatic = false) => {
    stopMotion();
    const rail = railRef.current;
    if (!rail) return;
    const from = rail.scrollLeft, to = rail.clientWidth * index;
    if (!animate || !rail.clientWidth || Math.abs(to - from) > rail.clientWidth * 1.01) {
      rail.scrollTo({ left: to, behavior: "auto" });
      syncSelection(rail);
      return;
    }
    const previousSnap = rail.style.getPropertyValue("scroll-snap-type");
    const previousPriority = rail.style.getPropertyPriority("scroll-snap-type");
    rail.style.setProperty("scroll-snap-type", "none", "important");
    restoreSnap.current = () => {
      if (previousSnap) rail.style.setProperty("scroll-snap-type", previousSnap, previousPriority);
      else rail.style.removeProperty("scroll-snap-type");
    };
    automaticMotion.current = automatic;
    let started: number | undefined;
    const frame = (time: number) => {
      started ??= time;
      const progress = Math.min(1, (time - started) / 400);
      rail.scrollLeft = from + (to - from) * progress * progress * (3 - 2 * progress);
      syncSelection(rail);
      if (progress < 1) motionFrame.current = window.requestAnimationFrame(frame);
      else {
        motionFrame.current = 0;
        restoreSnap.current?.();
        restoreSnap.current = null;
        automaticMotion.current = false;
      }
    };
    motionFrame.current = window.requestAnimationFrame(frame);
  }, [stopMotion, syncSelection]);
  const selected = Math.max(0, items.findIndex(item => item.id === selectedId));

  useEffect(() => {
    if (previousItems.current !== items) {
      stopMotion();
      previousItems.current = items;
      if (railRef.current) railRef.current.scrollLeft = railRef.current.clientWidth * selected;
    }
  }, [items, selected, stopMotion]);

  useEffect(() => stopMotion, [stopMotion]);
  useEffect(() => {
    if (reduceMotion !== false) {
      stopMotion();
      const rail = railRef.current;
      if (rail?.clientWidth) rail.scrollTo({ left: Math.round(rail.scrollLeft / rail.clientWidth) * rail.clientWidth, behavior: "auto" });
    }
  }, [reduceMotion, stopMotion]);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetchWebEvents({ limit: 5 }, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setPage(data);
      setSelectedId(id => data.items.some(item => item.id === id) ? id : data.items[0]?.id ?? null);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const motion = () => setReduceMotion(media ? media.matches : null);
    const activity = () => setActive(document.visibilityState === "visible" && document.hasFocus());
    const releaseDrag = () => setDrag(false);
    const checkModal = () => setModal(!!(document.querySelector("dialog[open]") || document.querySelector('[role="dialog"][aria-modal="true"]')));
    motion(); activity(); checkModal();
    media?.addEventListener?.("change", motion);
    document.addEventListener("visibilitychange", activity);
    window.addEventListener("focus", activity);
    window.addEventListener("blur", activity);
    window.addEventListener("pointerup", releaseDrag);
    window.addEventListener("pointercancel", releaseDrag);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)), { threshold: 0.25 });
    if (sectionRef.current) observer?.observe(sectionRef.current);
    const mutations = new MutationObserver(checkModal);
    mutations.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "role", "aria-modal"] });
    return () => {
      observer?.disconnect(); mutations.disconnect();
      media?.removeEventListener?.("change", motion);
      document.removeEventListener("visibilitychange", activity);
      window.removeEventListener("focus", activity); window.removeEventListener("blur", activity);
      window.removeEventListener("pointerup", releaseDrag); window.removeEventListener("pointercancel", releaseDrag);
    };
  }, []);

  const canAutoplay = items.length > 1 && visible && active && reduceMotion === false && !hover && !focus && !drag && !modal && !paused && !error;
  useEffect(() => { if (!canAutoplay && automaticMotion.current) stopMotion(); }, [canAutoplay, stopMotion]);
  useEffect(() => {
    if (!canAutoplay) return;
    const timer = window.setInterval(() => {
      const next = (selected + 1) % items.length;
      scrollToEvent(next, Math.abs(next - selected) <= 1, true);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [items, selected, canAutoplay, scrollToEvent]);

  function navigate(index: number) {
    setPaused(true);
    scrollToEvent(index, reduceMotion === false && Math.abs(index - selected) <= 1);
  }

  if (page && page.items.length === 0 && !error) return null;
  return (
    <section ref={sectionRef} className="mx-auto w-full max-w-[760px] px-5 py-6" aria-labelledby="home-events-title" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setFocus(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocus(false); }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><p className="mb-1 text-xs font-semibold tracking-wide text-accent">JAOTHUI COMPETITION</p><h2 id="home-events-title" className="text-lg font-semibold text-foreground">งานประกวดที่เปิดรับสมัคร</h2></div>
        {page && page.totalOpen > 5 ? <Link href="/v2/events" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-accent hover:text-accent-hover">ดูทั้งหมด ›</Link> : null}
      </div>
      {error ? <div role="status" className="mb-4 space-y-3 text-sm text-muted"><p>โหลดงานประกวดไม่สำเร็จ กรุณาลองอีกครั้ง</p><Button variant="gold-outline" onClick={() => setRetry(value => value + 1)}>ลองใหม่</Button></div> : null}
      {!page && !error ? <div aria-label="กำลังโหลดงานประกวด" className="aspect-video animate-pulse rounded-card bg-surface" /> : null}
      {items.length ? <>
        <div ref={railRef} role="region" tabIndex={0} aria-roledescription="สไลด์งานประกวด" aria-label="งานประกวดที่เปิดรับสมัคร" className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" onWheel={() => { stopMotion(); setPaused(true); }} onPointerDown={() => { stopMotion(); setDrag(true); setPaused(true); }} onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); navigate((selected + (event.key === "ArrowRight" ? 1 : items.length - 1)) % items.length); } }} onScroll={event => syncSelection(event.currentTarget)}>
          {items.map((event, index) => <div key={event.id} className="w-full shrink-0 snap-start" role="group" aria-roledescription="สไลด์" aria-label={`${index + 1} จาก ${items.length}`}><EventPreviewCard event={event} /></div>)}
        </div>
        {items.length > 1 ? <div className="mt-2 flex items-center justify-center gap-3">
          <LiquidPagination events={items} selectedId={selectedId} railRef={railRef} reduceMotion={reduceMotion} onSelect={navigate} onRebase={stopMotion} />
          <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" aria-label={paused ? "เล่นสไลด์อัตโนมัติ" : "หยุดสไลด์อัตโนมัติ"} aria-pressed={paused} onClick={() => setPaused(value => !value)}><span className="flex h-7 w-7 items-center justify-center rounded-pill border border-accent">{paused ? <FiPlay aria-hidden className="h-3.5 w-3.5" /> : <FiPause aria-hidden className="h-3.5 w-3.5" />}</span></button>
        </div> : null}
      </> : null}
    </section>
  );
}
