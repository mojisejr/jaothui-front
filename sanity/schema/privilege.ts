import {
  ArrayRule,
  BooleanRule,
  DateRule,
  StringRule,
  defineField,
  defineType,
} from "sanity";
import { contract } from "../../blockchain/contract";

export const privilegeType = defineType({
  name: "privilege",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Privilege Name",
      type: "string",
      // validation: (Rule: StringRule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "type",
      title: "Privilege Redeem Type",
      type: "string",
      options: {
        list: [
          { title: "Single", value: "single" },
          { title: "Multiple", value: "multiple" },
        ],
        layout: "radio",
      },
      // validation: (Rule: StringRule) => Rule.required(),
    }),
    defineField({
      name: "contract",
      title: "Redeemable Contract Address",
      type: "string",
      options: {
        list: [{ title: "Jaothui NFT", value: `${contract.nft.address}` }],
      },
      // validation: (Rule: StringRule) => Rule.required(),
    }),
    // defineField({
    //   name: "options",
    //   title: "Privilege Options",
    //   type: "array",
    //   of: [
    //     {
    //       type: "object",
    //       fields: [
    //         defineField({
    //           name: "image",
    //           type: "image",
    //         }),
    //         defineField({
    //           name: "option",
    //           type: "string",
    //         }),
    //       ],
    //     },
    //   ],
    //   // validation: (Rule: ArrayRule<String>) => Rule.required(),
    // }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      // validation: (Rule: StringRule) => Rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      // validation: (Rule: BooleanRule) => Rule.required(),
    }),
    defineField({
      name: "start",
      title: "From date",
      type: "date",
      // validation: (Rule: DateRule) => Rule.required(),
    }),
    defineField({
      name: "end",
      title: "To Date",
      type: "date",
      // validation: (Rule: DateRule) => Rule.required(),
    }),
  ],
});
