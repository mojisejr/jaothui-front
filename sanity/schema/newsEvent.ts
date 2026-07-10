import { defineField, defineType } from "sanity";

export const newsEventType = defineType({
  name: "newsEvent",
  type: "document",
  title: "News & Event",
  description: "ข่าวสาร กิจกรรม และประกาศสำหรับหน้าแรก JAOTHUI",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().min(3).max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 160,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9ก-๙-]/g, "")
            .slice(0, 160),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "type",
      title: "Content Type",
      type: "string",
      initialValue: "news",
      options: {
        list: [
          { title: "ข่าว", value: "news" },
          { title: "กิจกรรม", value: "event" },
          { title: "ประกาศ", value: "announcement" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "draft",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Published", value: "published" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Featured on home",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      description: "เลขน้อยขึ้นก่อน ใช้จัดลำดับข่าวเด่นบนหน้าแรก",
      initialValue: 100,
      validation: (Rule) => Rule.integer().min(0).max(999),
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const status = context.document?.status;
          if (status === "published" && !value) {
            return "Published content requires Published At";
          }
          return true;
        }),
    }),
    defineField({
      name: "eventStartAt",
      title: "Event Start At",
      type: "datetime",
      hidden: ({ document }) => document?.type !== "event",
    }),
    defineField({
      name: "eventEndAt",
      title: "Event End At",
      type: "datetime",
      hidden: ({ document }) => document?.type !== "event",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      hidden: ({ document }) => document?.type !== "event",
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      validation: (Rule) => Rule.required().min(20).max(220),
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "ctaLabel",
      title: "CTA Label",
      type: "string",
      description: "เช่น อ่านต่อ, ดูรายละเอียด, สมัครเข้าร่วม",
      validation: (Rule) => Rule.max(32),
    }),
    defineField({
      name: "ctaUrl",
      title: "CTA URL",
      type: "url",
      description: "ลิงก์ปลายทางสำหรับอ่านต่อหรือดูรายละเอียด",
      validation: (Rule) =>
        Rule.uri({
          scheme: ["http", "https"],
          allowRelative: true,
        }),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      description: "เนื้อหาแบบย่อสำหรับ MVP; rich text/detail page อยู่ phase ถัดไป",
    }),
  ],
  orderings: [
    {
      title: "Homepage priority",
      name: "homepagePriority",
      by: [
        { field: "featured", direction: "desc" },
        { field: "priority", direction: "asc" },
        { field: "publishedAt", direction: "desc" },
      ],
    },
    {
      title: "Published date, newest",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "type",
      media: "coverImage",
      status: "status",
      publishedAt: "publishedAt",
    },
    prepare({ title, subtitle, media, status, publishedAt }) {
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString("th-TH") : "no date";
      return {
        title,
        subtitle: `${subtitle ?? "news"} · ${status ?? "draft"} · ${date}`,
        media,
      };
    },
  },
});
