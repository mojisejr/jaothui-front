import { defineType, defineField } from "sanity";

export const gameHistoryType = defineType({
  title: "Game History",
  name: "gameHistory",
  type: "document",
  fields: [
    defineField({
      title: "Note",
      name: "note",
      type: "string",
    }),

    defineField({
      title: "Point",
      name: "point",
      type: "number",
    }),

    defineField({
      title: "Timestamp",
      name: "timestamp",
      type: "date",
    }),

    defineField({
      title: "Game",
      name: "game",
      type: "reference",
      //@ts-ignore
      to: [{ type: "game" }],
    }),

    defineField({
      title: "Token",
      name: "token",
      type: "reference",
      //@ts-ignore
      to: [{ type: "nftInGame" }],
    }),

    defineField({
      title: "Wallet",
      name: "wallet",
      type: "string",
    }),
  ],
});
