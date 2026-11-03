import { useEffect, useRef, type RefObject } from "react";
import { LIQUID_STEP, clampLiquidProgress, liquidShape, scrollLiquidProgress } from "../../utils/liquid-pagination";

type EventAnchor = { id: string; name: string };
type Props = {
  events: EventAnchor[];
  selectedId: string | null;
  railRef: RefObject<HTMLDivElement>;
  reduceMotion: boolean | null;
  onSelect: (index: number) => void;
  onRebase: () => void;
};

/** Controls are React; the decorative contour follows actual scrolling once per animation frame. */
export function LiquidPagination({ events, selectedId, railRef, reduceMotion, onSelect, onRebase }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const selected = Math.max(0, events.findIndex(event => event.id === selectedId));
  const selectedRef = useRef(selected);
  const initialPath = useRef(liquidShape(selected, events.length).path);
  const previousIds = useRef<string | null>(null);
  const ids = events.map(event => event.id).join("\0");
  const count = events.length;
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || count < 2) return;
    let frame = 0;
    let progress = scrollLiquidProgress(rail.scrollLeft, rail.clientWidth, count);
    if (previousIds.current !== null && previousIds.current !== ids) {
      onRebase();
      progress = clampLiquidProgress(selectedRef.current, count);
      rail.scrollLeft = progress * rail.clientWidth;
    }
    previousIds.current = ids;
    function paint() {
      const position = reduceMotion === false ? progress : Math.round(progress);
      pathRef.current?.setAttribute("d", liquidShape(position, count).path);
    }
    function scroll() {
      progress = scrollLiquidProgress(rail!.scrollLeft, rail!.clientWidth, count);
      if (reduceMotion !== false) { paint(); return; }
      if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; paint(); });
    }
    function resize() {
      onRebase();
      // Preserve the latest normalized drag position, including when a paint is still queued.
      progress = clampLiquidProgress(progress, count);
      rail!.scrollLeft = progress * rail!.clientWidth;
      paint();
    }
    paint();
    rail.addEventListener("scroll", scroll, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(rail);
    window.addEventListener("resize", resize);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      rail.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
    };
  }, [count, ids, railRef, reduceMotion, onRebase]);

  if (count < 2) return null;
  return <div className="relative flex h-11 shrink-0" aria-label="เลือกงานประกวด">
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 text-accent" width={count * LIQUID_STEP} height={44} viewBox={`0 0 ${count * LIQUID_STEP} 44`}>
      {events.map((event, index) => <circle key={event.id} cx={LIQUID_STEP / 2 + index * LIQUID_STEP} cy={22} r={4} className="fill-current text-muted" />)}
      <path ref={pathRef} d={initialPath.current} fill="currentColor" />
    </svg>
    {events.map((event, index) => <button key={event.id} type="button" aria-label={`แสดงงาน ${index + 1}: ${event.name}`} aria-current={index === selected ? "true" : undefined} className="relative h-11 w-11 rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" onClick={() => onSelect(index)} />)}
  </div>;
}
