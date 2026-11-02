import { z } from "zod";

export const newsEventAdminTypeSchema = z.enum(["news", "event", "announcement"]);
export const newsEventAdminStatusSchema = z.enum(["draft", "published", "archived"]);

export const newsEventAdminItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  type: newsEventAdminTypeSchema,
  status: newsEventAdminStatusSchema,
  featured: z.boolean(),
  priority: z.number(),
  publishedAt: z.string().nullable(),
  eventStartAt: z.string().nullable(),
  eventEndAt: z.string().nullable(),
  location: z.string().nullable(),
  excerpt: z.string(),
  coverImageUrl: z.string().nullable(),
  coverImageAssetRef: z.string().nullable(),
  ctaLabel: z.string().nullable(),
  ctaUrl: z.string().nullable(),
});

export const newsEventAdminListResponseSchema = z.object({
  items: z.array(newsEventAdminItemSchema),
});

export const newsEventAdminUpsertInputSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(140),
  type: newsEventAdminTypeSchema.default("news"),
  status: newsEventAdminStatusSchema.default("draft"),
  featured: z.boolean().default(false),
  priority: z.number().int().min(0).max(999).default(100),
  publishedAt: z.string().datetime().nullable().optional(),
  eventStartAt: z.string().datetime().nullable().optional(),
  eventEndAt: z.string().datetime().nullable().optional(),
  location: z.string().max(160).nullable().optional(),
  excerpt: z.string().min(1).max(240),
  coverImageAssetRef: z.string().nullable().optional(),
  ctaLabel: z.string().max(40).nullable().optional(),
  ctaUrl: z
    .string()
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//.test(value),
      "CTA URL must be relative or HTTP(S)"
    )
    .nullable()
    .optional(),
  body: z.string().max(6000).nullable().optional(),
});

export const newsEventAdminMutationResponseSchema = z.object({
  item: newsEventAdminItemSchema,
});

export const newsEventAdminPublishInputSchema = z.object({
  id: z.string().min(1),
});

export const newsEventAdminArchiveInputSchema = z.object({
  id: z.string().min(1),
});

export const newsEventAdminUploadCoverResponseSchema = z.object({
  assetRef: z.string().min(1),
  url: z.string().nullable(),
});

export type NewsEventAdminType = z.infer<typeof newsEventAdminTypeSchema>;
export type NewsEventAdminStatus = z.infer<typeof newsEventAdminStatusSchema>;
export type NewsEventAdminItem = z.infer<typeof newsEventAdminItemSchema>;
export type NewsEventAdminUpsertInput = z.infer<typeof newsEventAdminUpsertInputSchema>;

export function getNewsEventPublishMissingFields(
  item: Pick<NewsEventAdminItem, "title" | "slug" | "excerpt" | "publishedAt">
): string[] {
  return [
    item.title ? null : "title",
    item.slug ? null : "slug",
    item.excerpt ? null : "excerpt",
    item.publishedAt ? null : "publishedAt",
  ].filter(Boolean) as string[];
}
