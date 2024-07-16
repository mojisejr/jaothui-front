import { defineType, defineField } from "sanity";

export const gameType = defineType({
  title: "Game",
  name: "game",
  type: "document",
  fields: [
    defineField({
      title: "Title",
      name: "title",
      type: "string",
    }),

    defineField({
      title: "Image",
      name: "image",
      type: "image",
    }),

    defineField({
      title: "Game Type",
      name: "gameType",
      type: "string",
      options: {
        list: ["hotwheel"],
      },
    }),

    defineField({
      title: "Description",
      name: "description",
      type: "string",
    }),

    defineField({
      title: "Start At",
      name: "start",
      type: "datetime",
    }),

    defineField({
      title: "End At",
      name: "end",
      type: "datetime",
    }),

    defineField({
      title: "isActive",
      name: "isActive",
      type: "boolean",
      initialValue: true,
    }),

    defineField({
      title: "Game History",
      name: "gameHistory",
      type: "array",
      //@ts-ignore
      of: [
        {
          type: "reference",
          to: [{ type: "gameHistory" }],
        },
      ],
    }),

    defineField({
      title: "NFT IN GAME",
      name: "nftInGame",
      type: "array",
      //@ts-ignore
      of: [
        {
          type: "reference",
          to: [{ type: "nftInGame" }],
        },
      ],
    }),
  ],
});
