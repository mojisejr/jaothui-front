import { defineType, defineField } from "sanity";

export const userJaothuiPoint = defineType({
  title: "UserJaothuiPoint",
  name: "userJaothuiPoint",
  type: "document",
  fields: [
    defineField({
      title: "Wallet",
      name: "wallet",
      type: "string",
    }),

    defineField({
      title: "Current Points",
      name: "currentPoint",
      type: "number",
      initialValue: 0,
    }),

    defineField({
      title: "Used Point",
      name: "usedPoint",
      type: "number",
      initialValue: 0,
    }),

    defineField({
      title: "Redeem History",
      name: "redeemHistory",
      type: "array",
      //@ts-ignore
      of: [{ type: "reference", to: [{ type: "jaothuiRedeemHistory" }] }],
    }),
  ],
});
