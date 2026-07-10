import { FiArrowRight, FiCalendar, FiMapPin } from "react-icons/fi";

import type { NewsEventHomeItem, NewsEventType } from "../../interfaces/NewsEvent";
import { cn } from "./cn";
import { RemoteImage } from "./RemoteImage";

const typeLabel: Record<NewsEventType, string> = {
  news: "ข่าว",
  event: "กิจกรรม",
  announcement: "ประกาศ",
};

function formatDisplayDate(value: string | null) {
  if (!value) {
    return "เร็วๆ นี้";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function resolveDate(item: NewsEventHomeItem) {
  return item.type === "event" ? item.eventStartAt ?? item.publishedAt : item.publishedAt;
}

function getCtaLabel(item: NewsEventHomeItem) {
  if (item.ctaLabel) {
    return item.ctaLabel;
  }

  if (item.type === "event") {
    return "ดูรายละเอียด";
  }

  if (item.type === "announcement") {
    return "อ่านประกาศ";
  }

  return "อ่านต่อ";
}

export interface NewsEventCardProps {
  item: NewsEventHomeItem;
  className?: string;
  priority?: boolean;
}

export function NewsEventCard({ item, className, priority }: NewsEventCardProps) {
  const date = formatDisplayDate(resolveDate(item));
  const content = (
    <article
      className={cn(
        "group flex h-full min-h-[360px] flex-col overflow-hidden rounded-card border border-border-soft bg-surface text-left shadow-gold transition duration-300 hover:-translate-y-1 hover:border-accent focus-within:border-accent",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-raised">
        <RemoteImage
          src={item.coverImageUrl}
          alt={item.title}
          priority={priority}
          sizes="(max-width: 767px) 82vw, (max-width: 1439px) 42vw, 360px"
          fallback="/images/thuiLogo.png"
          className={cn(
            item.coverImageUrl ? "object-cover" : "object-contain p-12",
            "transition duration-500 group-hover:scale-105"
          )}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute left-4 top-4 rounded-pill border border-border-soft bg-overlay-badge px-3 py-1 text-xs font-semibold text-accent backdrop-blur-sm">
          {typeLabel[item.type]}
        </div>
        {item.featured && (
          <div className="absolute right-4 top-4 rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-background">
            แนะนำ
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted">
          <span className="inline-flex items-center gap-1.5">
            <FiCalendar aria-hidden className="h-3.5 w-3.5 text-accent" />
            {date}
          </span>
          {item.type === "event" && item.location && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <FiMapPin aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate">{item.location}</span>
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-foreground">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{item.excerpt}</p>

        <div className="mt-auto pt-5">
          {item.ctaUrl ? (
            <span className="inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-border-soft px-4 text-sm font-semibold text-accent transition group-hover:border-accent group-hover:bg-accent group-hover:text-background">
              {getCtaLabel(item)}
              <FiArrowRight aria-hidden className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          ) : (
            <span className="inline-flex min-h-[44px] items-center rounded-pill border border-border-soft px-4 text-sm font-semibold text-muted">
              รายละเอียดเร็วๆ นี้
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (!item.ctaUrl) {
    return content;
  }

  return (
    <a
      href={item.ctaUrl}
      className="block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      rel={item.ctaUrl.startsWith("http") ? "noreferrer" : undefined}
      target={item.ctaUrl.startsWith("http") ? "_blank" : undefined}
    >
      {content}
    </a>
  );
}
