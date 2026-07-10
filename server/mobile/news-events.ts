import type { NewsEventHomeItem, NewsEventType } from "../../interfaces/NewsEvent";
import { getHomeNewsEvents } from "../services/news-event.service";

export type MobileNewsEventType = NewsEventType;

export type MobileNewsEventCard = {
  id: string;
  title: string;
  slug: string;
  type: MobileNewsEventType;
  typeLabel: string;
  featured: boolean;
  priority: number;
  publishedAt: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  displayDate: string;
  location: string | null;
  excerpt: string;
  coverImageUrl: string | null;
  ctaLabel: string;
  ctaUrl: string | null;
};

export type MobileNewsEvents = {
  items: MobileNewsEventCard[];
};

const typeLabels: Record<MobileNewsEventType, string> = {
  news: "ข่าวสาร",
  event: "กิจกรรม",
  announcement: "ประกาศ",
};

function formatThaiDisplayDate(value: string | null) {
  if (!value) return "เร็วๆ นี้";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "เร็วๆ นี้";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDisplayDate(item: NewsEventHomeItem) {
  return formatThaiDisplayDate(item.type === "event" ? item.eventStartAt : item.publishedAt);
}

export function toMobileNewsEventCard(item: NewsEventHomeItem): MobileNewsEventCard {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    type: item.type,
    typeLabel: typeLabels[item.type],
    featured: item.featured,
    priority: item.priority,
    publishedAt: item.publishedAt,
    eventStartAt: item.eventStartAt,
    eventEndAt: item.eventEndAt,
    displayDate: getDisplayDate(item),
    location: item.location,
    excerpt: item.excerpt,
    coverImageUrl: item.coverImageUrl,
    ctaLabel: item.ctaLabel || "อ่านต่อ",
    ctaUrl: item.ctaUrl,
  };
}

export async function getMobileNewsEvents(): Promise<MobileNewsEvents> {
  const items = await getHomeNewsEvents();

  return {
    items: items.map(toMobileNewsEventCard),
  };
}
