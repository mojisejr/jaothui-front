import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
// import {
//   createLineItems,
//   createCheckoutParam,
//   stripeCheckOut,
// } from "../services/stripe.service";
import {
  createOrGetCustomer,
  getProductById,
  getProductFromHandle,
} from "../services/medusa.service";

export const storeRouter = router({
  //GET PRODUCT BY ID
  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        return await getProductById(input.id);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot fetch product from CMS",
        });
      }
    }),

  //GET PRODUCTS BY COLLECTION HANDLE
  getCollctions: publicProcedure
    .input(
      z.object({
        handle: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getProductFromHandle(input.handle);
    }),

  //CREATE OR LOGIN USER
  createOrGetCustomer: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        wallet: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createOrGetCustomer(input.wallet, input.email);
    }),

  // //CHECKOUT STRIPE (NO USE RIGHT NOW)
  // checkout: publicProcedure
  //   .input((value) => value)
  //   .mutation(async ({ ctx, input }) => {
  //     const inputData = input as {
  //       cart: Omit<Cart, "refundable_amount" | "refunded_total"> | undefined;
  //       basePath: string;
  //     };
  //     console.log("INPT DATA : ", inputData.cart?.items);
  //     const lineItems = createLineItems(inputData.cart?.items!);
  //     console.log("lineItems: ", lineItems);
  //     const checkoutParams = createCheckoutParam(lineItems, inputData.basePath);
  //     console.log("checkoutParams: ", checkoutParams);
  //     const checkoutSession = await stripeCheckOut(checkoutParams);
  //     console.log("session: ", checkoutSession);
  //     return checkoutSession;
  //   }),
});
