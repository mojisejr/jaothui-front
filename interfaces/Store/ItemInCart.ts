import { Product } from "./Product";
import { z } from "zod";

export type ItemInCart = Product & { qty: number };

export const ItemInCartInput = z.object({
  _id: z.string(),
  images: z.array(z.string()),
  slug: z.string().nullable(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  discount: z.number().nullable(),
  isDiscount: z.boolean(),
  inStock: z.boolean(),
  attributes: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
    })
  ),
  qty: z.number(),
});
