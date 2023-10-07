import { Product } from "./Product";
import { z } from "zod";
import { Cart } from "@medusajs/medusa";

export type ItemInCart = Product & { qty: number };

export const ItemInCartInput = z.object({
  _id: z.string(),
  images: z.array(z.string()),
  slug: z.string().nullable(),
  name: z.string(),
  modelno: z.string(),
  price: z.number(),
  discount: z.number().nullable(),
  desc: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
    })
  ),
  qty: z.number(),
});
