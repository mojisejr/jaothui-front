import { defineType, defineField } from "sanity";

export const nftInGameType = defineType({
  title: "NFT in GAME",
  name: "nftInGame",
  type: "document",
  fields: [
    defineField({
      title: "Contract Address",
      name: "contractAddress",
      type: "string",
    }),

    defineField({
      title: "Token ID",
      name: "tokenId",
      type: "string",
    }),

    defineField({
      title: "EXP",
      name: "exp",
      type: "number",
      initialValue: 0,
    }),

    defineField({
      title: "Level",
      name: "level",
      type: "number",
      initialValue: 1,
    }),

    defineField({
      title: "Point",
      name: "point",
      type: "number",
      initialValue: 1,
    }),

    defineField({
      title: "isActive",
      name: "isActive",
      type: "boolean",
      initialValue: true,
    }),

    defineField({
      title: "Metadata",
      name: "metadata",
      type: "array",
      //@ts-ignore
      of: [
        {
          type: "object",
          fields: [
            defineField({
              title: "Type",
              name: "type",
              type: "string",
            }),

            defineField({
              title: "Value",
              name: "value",
              type: "string",
            }),
          ],
        },
      ],
    }),

    defineField({
      title: "Timestamp",
      name: "timestamp",
      type: "datetime",
    }),

    defineField({
      title: "Game",
      name: "game",
      type: "reference",
      //@ts-ignore
      to: [{ type: "game" }],
    }),
  ],
});
