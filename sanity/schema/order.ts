import { defineField, defineType, NumberRule } from "sanity";

export const orderType = defineType({
  name: "orders",
  type: "document",
  fields: [
    defineField({
      name: "stripeIntentId",
      title: "Stripe Intent Id",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "wallet",
      title: "customer wallet",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "email",
      title: "customer email",
      type: "string",
      readOnly: true,
    }),

    defineField({
      name: "products",
      title: "Purchase Detail",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "product",
              title: "Product",
              type: "string",
            }),

            defineField({
              name: "amount",
              title: "amount",
              type: "number",
            }),

            defineField({
              name: "subtotal",
              title: "Subtotal",
              type: "number",
            }),
          ],
        },
      ],
    }),

    defineField({
      name: "shippingAddress",
      title: "Shipping Address",
      type: "object",
      fields: [
        defineField({
          name: "name",
          title: "ชื่อ",
          type: "string",
        }),

        defineField({
          name: "address1",
          title: "บ้านเลขที่",
          type: "string",
        }),

        defineField({
          name: "tambon",
          title: "ตำบล",
          type: "string",
        }),

        defineField({
          name: "amphoe",
          title: "อำเภอ",
          type: "string",
        }),

        defineField({
          name: "province",
          title: "จังหวัด",
          type: "string",
        }),

        defineField({
          name: "postcode",
          title: "รหัสไปรษณี",
          type: "number",
        }),

        defineField({
          name: "phone",
          title: "โทรศัพท์",
          type: "string",
        }),
      ],
    }),

    defineField({
      name: "paymentStatus",
      title: "Payment status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Paid", value: "paid" },
        ],
        layout: "dropdown",
      },
      initialValue: "pending",
    }),

    defineField({
      name: "shippingStatus",
      title: "Shipping Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Shipped", value: "shipped" },
          { title: "Received", value: "received" },
        ],
      },
      initialValue: "pending",
    }),

    defineField({
      name: "orderStatus",
      title: "Order Status",
      type: "string",
      options: {
        list: [
          { title: "Processing", value: "processing" },
          { title: "Completed", value: "completed" },
          { title: "Canceled", value: "canceled" },
          { title: "Refuneded", value: "refunded" },
        ],
      },
    }),

    defineField({
      name: "note",
      title: "note",
      type: "text",
    }),
  ],
});
