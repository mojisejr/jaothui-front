import { groq } from "next-sanity";
import type { Image } from "sanity";

import type {
  NewsEventHomeItem,
  NewsEventStatus,
  NewsEventType,
} from "../../interfaces/NewsEvent";
import { client } from "../../sanity/lib/client";
import { urlForNewsEventCoverImage } from "../../sanity/lib/image";

interface SanityNewsEventDocument {
  _id?: string;
  title?: string;
  slug?: string;
  type?: NewsEventType;
  status?: NewsEventStatus;
  featured?: boolean;
  priority?: number;
  publishedAt?: string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  location?: string | null;
  excerpt?: string;
  coverImage?: Image | null;
  rawCoverImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

const HOME_NEWS_EVENT_LIMIT = 5;

const homeNewsEventsQuery = groq`*[_type == "newsEvent" && status == "published"]
  | order(featured desc, coalesce(priority, 100) asc, publishedAt desc)[0...${HOME_NEWS_EVENT_LIMIT}] {
    _id,
    title,
    "slug": slug.current,
    type,
    status,
    featured,
    priority,
    publishedAt,
    eventStartAt,
    eventEndAt,
    location,
    excerpt,
    coverImage,
    "rawCoverImageUrl": coverImage.asset->url,
    ctaLabel,
    ctaUrl
  }`;

function normalizeNewsEventType(type?: string): NewsEventType {
  if (type === "event" || type === "announcement") {
    return type;
  }

  return "news";
}

function normalizeNewsEventStatus(status?: string): NewsEventStatus {
  if (status === "draft" || status === "archived") {
    return status;
  }

  return "published";
}

export function mapNewsEventHomeItem(
  item: SanityNewsEventDocument
): NewsEventHomeItem | null {
  if (!item._id || !item.title || !item.slug || !item.excerpt) {
    return null;
  }

  return {
    id: item._id,
    title: item.title,
    slug: item.slug,
    type: normalizeNewsEventType(item.type),
    status: normalizeNewsEventStatus(item.status),
    featured: Boolean(item.featured),
    priority: typeof item.priority === "number" ? item.priority : 100,
    publishedAt: item.publishedAt ?? null,
    eventStartAt: item.eventStartAt ?? null,
    eventEndAt: item.eventEndAt ?? null,
    location: item.location ?? null,
    excerpt: item.excerpt,
    coverImageUrl: getNewsEventCoverImageUrl(item.coverImage, item.rawCoverImageUrl),
    ctaLabel: item.ctaLabel ?? null,
    ctaUrl: item.ctaUrl ?? null,
  };
}

export function getNewsEventCoverImageUrl(
  coverImage?: Image | null,
  fallbackUrl?: string | null
) {
  if (!coverImage) {
    return fallbackUrl ?? null;
  }

  try {
    return urlForNewsEventCoverImage(coverImage).url();
  } catch (error) {
    console.warn("[news-event.service] Failed to build news event cover image URL", error);
    return fallbackUrl ?? null;
  }
}

export async function getHomeNewsEvents(): Promise<NewsEventHomeItem[]> {
  try {
    const result = await client.fetch<SanityNewsEventDocument[]>(homeNewsEventsQuery);
    return result.map(mapNewsEventHomeItem).filter(Boolean) as NewsEventHomeItem[];
  } catch (error) {
    console.warn("[news-event.service] Failed to fetch home news events", error);
    return [];
  }
}
