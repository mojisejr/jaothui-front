import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/router";
import { useInView, useReducedMotion } from "framer-motion";
import { FiUsers, FiDatabase, FiActivity, FiShield } from "react-icons/fi";
import type { HomeStat } from "../../server/services/home-stats.service";
import { StatCard } from "./StatCard";
import { HomeCountUp, countWidthRulers, formatCount, validCount } from "./homeCountUp";

const ICONS = { farmers: <FiUsers />, buffalos: <FiDatabase />,
  events: <FiActivity />, verified: <FiShield /> };

/** Numeric-only subscription: no Home/gallery rerender on animation frames. */
export function HomeStatValue({ stat, controller }: { stat: HomeStat; controller: HomeCountUp }) {
  const target = validCount(stat.count);
  const subscribe = (notify: () => void) => controller.subscribe(stat.id, notify);
  const snapshot = useSyncExternalStore(
    subscribe,
    () => controller.snapshot(stat.id),
    () => controller.snapshot(stat.id)
  );
  // SSR and first hydration both have final snapshots. A changed target renders
  // its authoritative final value even before the parent reconciliation effect.
  const current = snapshot?.target === target ? snapshot.current : target;
  const finalValue = target === null ? stat.value : formatCount(target);
  const display = current === null || current === undefined ? stat.value : formatCount(current);
  return (
    <span className="relative inline-grid tabular-nums" data-home-stat={stat.id}>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">{finalValue}</span>
      {target !== null && countWidthRulers(target).map((ruler, digit) => (
        <span key={digit} aria-hidden="true" data-count-width-ruler={digit}
          className="invisible col-start-1 row-start-1">{ruler}</span>
      ))}
      {/* Out of flow: even a wide intermediate cannot push the unit sideways. */}
      <span aria-hidden="true" className="absolute inset-0"
        data-testid={`home-stat-count-${stat.id}`} data-count={current ?? undefined}
        data-target={target ?? undefined}>{display}</span>
    </span>
  );
}

/** Opt-in Home presentation; StatCard/showcase defaults remain static. */
export function HomeStatsGrid({ stats }: { stats: HomeStat[] }) {
  const ref = useRef<HTMLElement>(null);
  const router = useRouter();
  const isInView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  const [controller] = useState(() => new HomeCountUp(stats, {
    request: (callback) => window.requestAnimationFrame(callback),
    cancel: (handle) => window.cancelAnimationFrame(handle),
    now: () => performance.now(),
  }));

  useEffect(() => { controller.replaceTargets(stats); }, [controller, stats]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !window.matchMedia || !window.IntersectionObserver) {
      controller.settle();
      return;
    }
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rect = element.getBoundingClientRect();
    const exposed = rect.bottom > 0 && rect.top < window.innerHeight;
    controller.prepare(!exposed, preference.matches || reducedMotion === true, document.hidden);
    const onPreference = () => { if (preference.matches) controller.settle(); };
    const onVisibility = () => { if (document.hidden) controller.settle(); };
    preference.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", controller.settle);
    router.events.on("routeChangeStart", controller.settle);
    return () => {
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", controller.settle);
      router.events.off("routeChangeStart", controller.settle);
      controller.detach();
    };
    // Preference changes use matchMedia's live event; framer v10's hook only
    // captures its initial value. Do not restart preparation on hook rerenders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, router.events]);

  useEffect(() => {
    if (isInView) controller.reveal();
  }, [controller, isInView]);

  return (
    <section ref={ref} data-testid="home-stats-grid" className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 px-5 py-6 tabletS:grid-cols-4 tabletS:gap-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          icon={ICONS[stat.id]}
          value={<HomeStatValue stat={stat} controller={controller} />}
          unit={stat.unit}
          label={stat.label}
          accessibleValue={`${stat.label}: ${validCount(stat.count) === null ? stat.value : formatCount(stat.count!)} ${stat.unit}`}
        />
      ))}
    </section>
  );
}
