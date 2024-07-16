import { defineField, defineType } from "sanity";

export const redeemItemType = defineType({
  title: "Jaothui Point Redeem Item",
  name: "jaothuiRedeemItem",
  type: "document",
  fields: [
    defineField({
      title: "Name",
      name: "name",
      type: "string",
    }),

    defineField({
      title: "Image",
      name: "image",
      type: "image",
    }),

    defineField({
      title: "Description",
      name: "description",
      type: "string",
    }),

    defineField({
      title: "Point",
      name: "point",
      type: "number",
    }),

    defineField({
      title: "isActive",
      name: "isActive",
      type: "boolean",
      initialValue: true,
    }),
  ],
});
