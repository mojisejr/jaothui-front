import { defineType, defineField, StringRule, NumberRule } from "sanity";

export const productType = defineType({
  name: "product",
  type: "document",
  title: "Product",
  description: "ข้อมูลสินค้าใน shop",
  fields: [
    defineField({
      name: "name",
      title: "Product Name",
      type: "string",
      // validation: (Rule: StringRule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 200,
        slugify: (input: string) =>
          input.toLowerCase().replace(/\s+/g, "-").slice(0, 200),
      },
    }),

    // defineField({
    //   name: "images",
    //   title: "Product Images",
    //   type: "array",
    //   description:
    //     "multiple images is available, but the first one is the main image",
    //   of: [
    //     {
    //       type: "image",
    //       options: {
    //         hotspot: true,
    //       },
    //     },
    //   ],
    //   // validation: (Rule) => Rule.required(),
    // }),

    defineField({
      name: "category",
      title: "Product Category",
      type: "string",
      options: {
        list: [
          { title: "Arttoy", value: "arttoy" },
          { title: "Food", value: "food" },
          { title: "Non-Food", value: "nonFood" },
          { title: "Other", value: "other" },
        ],
        layout: "dropdown",
      },
      // validation: (Rule) => Rule.required(),
    }),

    // defineField({
    //   name: "attributes",
    //   title: "Product Attributes",
    //   type: "array",
    //   description:
    //     "product attribute eg. it's color, model, serial number, contract address etc.",
    //   of: [
    //     {
    //       type: "object",
    //       fields: [
    //         defineField({
    //           name: "title",
    //           title: "Attribute Name",
    //           type: "string",
    //         }),

    //         defineField({
    //           name: "value",
    //           title: "Attribute Value",
    //           type: "string",
    //         }),
    //       ],
    //     },
    //   ],
    // }),

    defineField({
      name: "price",
      title: "Product Price (THB)",
      type: "number",
      description: "Product price in thai baht",
      // validation: (Rule: NumberRule) => Rule.required().precision(2).positive(),
    }),

    defineField({
      name: "isDiscount",
      title: "Check this if want to make this item discount",
      type: "boolean",
      initialValue: false,
    }),

    defineField({
      name: "discount",
      title: "Discount Percent (%)",
      type: "number",
      description: "max 90; input only number dont input %",
      // validation: (Rule: NumberRule) => Rule.positive().max(90),
    }),

    defineField({
      name: "inStock",
      title: "In Stock ?",
      type: "boolean",
      initialValue: false,
    }),

    defineField({
      name: "description",
      title: "Product description",
      type: "text",
    }),
  ],
});
