import { motion, useReducedMotion } from "framer-motion";
import { FiCalendar } from "react-icons/fi";

import type { NewsEventHomeItem } from "../../interfaces/NewsEvent";
import { cn } from "./cn";
import { NewsEventCard } from "./NewsEventCard";

export interface NewsEventRailProps {
  items: NewsEventHomeItem[];
  className?: string;
}

export function NewsEventRail({ items, className }: NewsEventRailProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className={cn("mx-auto w-full max-w-5xl px-5 py-6", className)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            News & Events
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">ข่าวสารและกิจกรรม</h2>
        </div>
        {items.length > 0 && (
          <p className="hidden text-sm text-muted tabletS:block">อัปเดตล่าสุดจากเจ้าทุย</p>
        )}
      </div>

      {items.length > 0 ? (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-16 bg-gradient-to-l from-background to-transparent tabletS:block" />
          <div className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 tabletS:mx-0 tabletS:px-0">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-[82%] snap-start mobileM:min-w-[78%] tabletS:min-w-[340px] tabletS:max-w-[360px]"
              >
                <NewsEventCard item={item} priority={index === 0} />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-border-soft bg-surface px-5 py-8 text-center shadow-gold">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-accent-soft text-accent">
            <FiCalendar aria-hidden className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">ยังไม่มีข่าวสารใหม่</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            เมื่อมีข่าว กิจกรรม หรือประกาศจากเจ้าทุย รายการล่าสุดจะแสดงตรงนี้เป็นลำดับแรก
          </p>
        </div>
      )}
    </section>
  );
}
