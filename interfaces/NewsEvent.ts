export type NewsEventType = "news" | "event" | "announcement";

export type NewsEventStatus = "draft" | "published" | "archived";

export interface NewsEventHomeItem {
  id: string;
  title: string;
  slug: string;
  type: NewsEventType;
  status: NewsEventStatus;
  featured: boolean;
  priority: number;
  publishedAt: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  location: string | null;
  excerpt: string;
  coverImageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}
