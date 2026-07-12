import { groq } from "next-sanity";
import type { Image } from "sanity";

import { client } from "../../sanity/lib/client";
import { getNewsEventCoverImageUrl } from "../services/news-event.service";
import {
  getNewsEventPublishMissingFields,
  newsEventAdminUpsertInputSchema,
  type NewsEventAdminItem,
  type NewsEventAdminStatus,
  type NewsEventAdminType,
  type NewsEventAdminUpsertInput,
} from "./news-event-admin-contract";

interface SanityNewsEventAdminDocument {
  _id?: string;
  title?: string;
  slug?: string;
  type?: NewsEventAdminType;
  status?: NewsEventAdminStatus;
  featured?: boolean;
  priority?: number;
  publishedAt?: string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  location?: string | null;
  excerpt?: string;
  coverImage?: Image | null;
  coverImageAssetRef?: string | null;
  rawCoverImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

export class NewsEventAdminValidationError extends Error {
  readonly statusCode = 400;
  readonly fields: string[];

  constructor(message: string, fields: string[] = []) {
    super(message);
    this.name = "NewsEventAdminValidationError";
    this.fields = fields;
  }
}

const adminNewsEventProjection = groq`{
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
  "coverImageAssetRef": coverImage.asset._ref,
  "rawCoverImageUrl": coverImage.asset->url,
  ctaLabel,
  ctaUrl
}`;

const listAdminNewsEventsQuery = groq`*[_type == "newsEvent"]
  | order(coalesce(priority, 100) asc, publishedAt desc, _createdAt desc) ${adminNewsEventProjection}`;

const getAdminNewsEventByIdQuery = groq`*[_type == "newsEvent" && _id == $id][0] ${adminNewsEventProjection}`;

function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9ก-๙-]/g, "")
    .slice(0, 160);
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapNewsEventAdminItem(
  item: SanityNewsEventAdminDocument | null
): NewsEventAdminItem | null {
  if (!item?._id || !item.title || !item.slug || !item.excerpt) {
    return null;
  }

  return {
    id: item._id,
    title: item.title,
    slug: item.slug,
    type: item.type ?? "news",
    status: item.status ?? "draft",
    featured: Boolean(item.featured),
    priority: typeof item.priority === "number" ? item.priority : 100,
    publishedAt: item.publishedAt ?? null,
    eventStartAt: item.eventStartAt ?? null,
    eventEndAt: item.eventEndAt ?? null,
    location: item.location ?? null,
    excerpt: item.excerpt,
    coverImageUrl: getNewsEventCoverImageUrl(item.coverImage, item.rawCoverImageUrl),
    coverImageAssetRef: item.coverImageAssetRef ?? null,
    ctaLabel: item.ctaLabel ?? null,
    ctaUrl: item.ctaUrl ?? null,
  };
}

function toSanityNewsEventPatch(input: NewsEventAdminUpsertInput) {
  const parsed = newsEventAdminUpsertInputSchema.parse({
    ...input,
    slug: normalizeSlug(input.slug),
    location: normalizeNullableString(input.location),
    ctaLabel: normalizeNullableString(input.ctaLabel),
    ctaUrl: normalizeNullableString(input.ctaUrl),
    body: normalizeNullableString(input.body),
  });

  return {
    title: parsed.title.trim(),
    slug: {
      _type: "slug",
      current: normalizeSlug(parsed.slug),
    },
    type: parsed.type,
    status: parsed.status,
    featured: parsed.featured,
    priority: parsed.priority,
    publishedAt: parsed.publishedAt ?? null,
    eventStartAt: parsed.type === "event" ? parsed.eventStartAt ?? null : null,
    eventEndAt: parsed.type === "event" ? parsed.eventEndAt ?? null : null,
    location: parsed.type === "event" ? parsed.location ?? null : null,
    excerpt: parsed.excerpt.trim(),
    ...(parsed.coverImageAssetRef
      ? {
          coverImage: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: parsed.coverImageAssetRef,
            },
          },
        }
      : {}),
    ctaLabel: parsed.ctaLabel ?? null,
    ctaUrl: parsed.ctaUrl ?? null,
    body: parsed.body ?? null,
  };
}

function assertPublishable(item: NewsEventAdminItem): void {
  const missingFields = getNewsEventPublishMissingFields(item);
  if (missingFields.length > 0) {
    throw new NewsEventAdminValidationError(
      `Cannot publish news event: missing ${missingFields.join(", ")}`,
      missingFields
    );
  }
}

async function requireNewsEventById(id: string): Promise<NewsEventAdminItem> {
  const found = mapNewsEventAdminItem(
    await client.fetch<SanityNewsEventAdminDocument | null>(
      getAdminNewsEventByIdQuery,
      { id }
    )
  );

  if (!found) {
    throw new NewsEventAdminValidationError("News event not found", ["id"]);
  }

  return found;
}

export async function listNewsEventsForAdmin(): Promise<NewsEventAdminItem[]> {
  const result = await client.fetch<SanityNewsEventAdminDocument[]>(
    listAdminNewsEventsQuery
  );
  return result.map(mapNewsEventAdminItem).filter(Boolean) as NewsEventAdminItem[];
}

export async function getNewsEventForAdmin(id: string): Promise<NewsEventAdminItem> {
  return requireNewsEventById(id);
}

export async function createNewsEventForAdmin(
  input: NewsEventAdminUpsertInput
): Promise<NewsEventAdminItem> {
  const created = await client.create({
    _type: "newsEvent",
    ...toSanityNewsEventPatch({ ...input, status: input.status ?? "draft" }),
  });

  return requireNewsEventById(created._id);
}

export async function updateNewsEventForAdmin(
  id: string,
  input: NewsEventAdminUpsertInput
): Promise<NewsEventAdminItem> {
  await requireNewsEventById(id);
  await client.patch(id).set(toSanityNewsEventPatch(input)).commit();
  return requireNewsEventById(id);
}

export async function publishNewsEventForAdmin(
  id: string
): Promise<NewsEventAdminItem> {
  const current = await requireNewsEventById(id);
  assertPublishable(current);
  await client.patch(id).set({ status: "published" }).commit();
  return requireNewsEventById(id);
}

export async function archiveNewsEventForAdmin(
  id: string
): Promise<NewsEventAdminItem> {
  await requireNewsEventById(id);
  await client.patch(id).set({ status: "archived" }).commit();
  return requireNewsEventById(id);
}

export async function uploadNewsEventCoverForAdmin(
  imageBuffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ assetRef: string; url: string | null }> {
  if (!contentType.startsWith("image/")) {
    throw new NewsEventAdminValidationError("Cover upload must be an image", [
      "contentType",
    ]);
  }

  const asset = await client.assets.upload("image", imageBuffer, {
    filename,
    contentType,
  });

  return {
    assetRef: asset._id,
    url: asset.url ?? null,
  };
}
