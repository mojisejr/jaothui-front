import { defineField, defineType } from "sanity";

export const RedemptionType = defineType({
  name: "redemption",
  type: "document",
  fields: [
    defineField({
      name: "wallet",
      title: "Redeemer Wallet",
      type: "string",
    }),

    defineField({
      name: "tokenId",
      title: "Redeemed Token Id",
      type: "string",
    }),

    defineField({
      name: "redeemInfo",
      title: "Redemption Information",
      type: "string",
    }),

    defineField({
      name: "isRedeemed",
      title: "Redeemed ?",
      type: "boolean",
      initialValue: false,
    }),

    // defineField({
    //   name: "privilege",
    //   title: "Privilege Reference",
    //   type: "reference",
    //   to: [{ type: "privilege" }],
    // }),
  ],
});
