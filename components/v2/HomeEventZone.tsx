import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
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
  const selected = Math.max(0, items.findIndex(item => item.id === selectedId));

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

  useEffect(() => {
    if (items.length < 2 || !visible || !active || reduceMotion !== false || hover || focus || drag || modal || paused || error) return;
    const timer = window.setInterval(() => {
      const next = (selected + 1) % items.length;
      setSelectedId(items[next].id);
      const rail = railRef.current;
      if (rail) rail.scrollTo({ left: rail.clientWidth * next, behavior: "smooth" });
    }, 5500);
    return () => window.clearInterval(timer);
  }, [items, selected, visible, active, reduceMotion, hover, focus, drag, modal, paused, error]);

  function navigate(index: number) {
    setPaused(true);
    setSelectedId(items[index].id);
    railRef.current?.scrollTo({ left: railRef.current.clientWidth * index, behavior: reduceMotion === false ? "smooth" : "auto" });
  }

  if (page && page.items.length === 0 && !error) return null;
  return (
    <section ref={sectionRef} className="mx-auto w-full max-w-5xl px-5 py-6" aria-labelledby="home-events-title" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setFocus(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocus(false); }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="home-events-title" className="text-base font-semibold text-foreground">งานประกวดที่เปิดรับสมัคร</h2>
        {page && page.totalOpen > 5 ? <Link href="/v2/events" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-accent hover:text-accent-hover">ดูทั้งหมด ›</Link> : null}
      </div>
      {error ? <div role="status" className="mb-4 space-y-3 text-sm text-muted"><p>โหลดงานประกวดไม่สำเร็จ กรุณาลองอีกครั้ง</p><Button variant="gold-outline" onClick={() => setRetry(value => value + 1)}>ลองใหม่</Button></div> : null}
      {!page && !error ? <div aria-label="กำลังโหลดงานประกวด" className="aspect-video animate-pulse rounded-card bg-surface" /> : null}
      {items.length ? <>
        <div ref={railRef} role="region" aria-roledescription="สไลด์งานประกวด" aria-label="งานประกวดที่เปิดรับสมัคร" className="flex snap-x snap-mandatory overflow-x-auto rounded-card" onWheel={() => setPaused(true)} onPointerDown={() => { setDrag(true); setPaused(true); }} onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); navigate((selected + (event.key === "ArrowRight" ? 1 : items.length - 1)) % items.length); } }} onScroll={event => {
          const rail = event.currentTarget;
          const index = Math.max(0, Math.min(items.length - 1, Math.round(rail.scrollLeft / (rail.clientWidth || 1))));
          setSelectedId(items[index].id);
        }}>
          {items.map((event, index) => <div key={event.id} className="w-full shrink-0 snap-start" role="group" aria-roledescription="สไลด์" aria-label={`${index + 1} จาก ${items.length}`}><EventPreviewCard event={event} /></div>)}
        </div>
        {items.length > 1 ? <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
          {items.map((event, index) => <button key={event.id} type="button" aria-label={`แสดงงาน ${index + 1}: ${event.name}`} aria-current={index === selected ? "true" : undefined} className="flex h-11 w-11 items-center justify-center rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" onClick={() => navigate(index)}><span aria-hidden className={`h-2 w-2 rounded-pill ${index === selected ? "bg-accent" : "bg-muted"}`} /></button>)}
          <button type="button" className="min-h-[44px] min-w-[44px] px-3 text-sm text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "เล่นสไลด์อัตโนมัติ" : "หยุดสไลด์อัตโนมัติ"}</button>
        </div> : null}
      </> : null}
    </section>
  );
}
