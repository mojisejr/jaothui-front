import { defineType, defineField } from "sanity";

export const redeemHistoryType = defineType({
  title: "Jaothui Point Redeem History",
  name: "jaothuiRedeemHistory",
  type: "document",
  fields: [
    defineField({
      title: "Redeemed Point",
      name: "redeemedPoint",
      type: "number",
    }),

    defineField({
      title: "Name",
      name: "name",
      type: "string",
    }),

    defineField({
      title: "Address",
      name: "address",
      type: "string",
    }),

    defineField({
      title: "Tel",
      name: "tel",
      type: "string",
    }),

    defineField({
      title: "Tracking No.",
      name: "trackingNo",
      type: "string",
    }),

    defineField({
      title: "Tracking Name",
      name: "trackingName",
      type: "string",
    }),

    defineField({
      title: "Status",
      name: "status",
      type: "string",
    }),

    defineField({
      title: "wallet",
      name: "wallet",
      type: "reference",
      //@ts-ignore
      to: [{ type: "userJaothuiPoint" }],
    }),

    defineField({
      title: "Timestamp",
      name: "timestamp",
      type: "datetime",
    }),

    defineField({
      title: "Redeemed Item",
      name: "redeemedItem",
      type: "reference",
      //@ts-ignore
      to: [{ type: "jaothuiRedeemItem" }],
    }),
  ],
});
