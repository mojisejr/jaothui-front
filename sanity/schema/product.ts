import { defineType, defineField, ImageOptions, ArrayOptions } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      description: "Product Images",
      of: [{ type: "image" }],
      options: {
        hotspot: true,
      } as ArrayOptions<ImageOptions>,
    }),

    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Product's Name",
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "array",
      of: [{ type: "string" }],
    }),

    defineField({
      name: "modelno",
      title: "Model No",
      type: "string",
      description:
        "Model Number is going to be used as the items path so must be unique",
    }),

    defineField({
      name: "price",
      title: "Price",
      type: "number",
      description: "Price in Thai Baht",
    }),

    defineField({
      name: "discount",
      title: "Discount Price",
      type: "number",
      description: "Discount Price if any",
    }),

    defineField({
      name: "desc",
      title: "Description",
      type: "array",
      of: [
        {
          type: "object",
          name: "inline",
          fields: [
            { type: "string", name: "title" },
            { type: "string", name: "value" },
          ],
        },
      ],
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "modelno",
        maxLength: 200,
      },
      description: "generate the slug for the item path",
    }),
  ],
});
