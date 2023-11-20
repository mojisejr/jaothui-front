import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createLineItems,
  createCheckoutParam,
  stripeCheckOut,
  getSessionById,
} from "../services/stripe.service";

import {
  getAllProducts,
  getProductByCategory,
  getProductById,
} from "../services/product.service";
import { ItemInCart } from "../../interfaces/Store/ItemInCart";
import { createOrder, getOrdersByWallet } from "../services/order.service";

export const storeRouter = router({
  //GET PRODUCT BY ID
  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await getAllProducts();
    if (products.length <= 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No Product Found!" });
    }
    return products;
  }),

  getByCat: publicProcedure
    .input(
      z.object({
        category: z.string(),
      })
    )
    .query(async ({ input }) => {
      const products = await getProductByCategory(input.category);
      if (products.length <= 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No Product Found!",
        });
      }
      return products;
    }),
  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const product = await getProductById(input.id);
      if (product == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No Product Found",
        });
      }

      return product;
    }),

  // //CHECKOUT STRIPE (NO USE RIGHT NOW)
  checkout: publicProcedure
    .input((value) => value)
    .mutation(async ({ ctx, input }) => {
      const inputData = input as {
        wallet: string;
        items: ItemInCart[];
        basePath: string;
      };
      const lineItems = createLineItems(inputData.items);
      const checkoutParams = createCheckoutParam(
        inputData.wallet,
        lineItems,
        inputData.basePath
      );
      const checkoutSession = await stripeCheckOut(checkoutParams);
      return checkoutSession;
    }),

  createOrder: publicProcedure
    .input(
      z.object({
        session: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const session = await getSessionById(input.session);
      await createOrder(session);
    }),

  getOrder: publicProcedure
    .input(z.object({ wallet: z.string() }))
    .query(async ({ input }) => {
      const orders = await getOrdersByWallet(input.wallet);
      //TODO: handle error
      return orders;
    }),
});
