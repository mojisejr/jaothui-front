import { publicProcedure, router } from "../trpc";
import { getProducts } from "../services/store.service";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ItemInCartInput } from "../../interfaces/Store/ItemInCart";
import {
  createLineItems,
  createCheckoutParam,
  stripeCheckOut,
} from "../services/stripe.service";
import { Cart } from "@medusajs/medusa";
import { createOrGetCustomer } from "../services/medusa.service";

export const storeRouter = router({
  get: publicProcedure.query(async ({ ctx }) => {
    try {
      return await getProducts();
    } catch (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot fetch product from CMS",
      });
    }
  }),
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
  checkout: publicProcedure
    .input((value) => value)
    .mutation(async ({ ctx, input }) => {
      const inputData = input as {
        cart: Omit<Cart, "refundable_amount" | "refunded_total"> | undefined;
        basePath: string;
      };
      console.log("INPT DATA : ", inputData.cart?.items);
      const lineItems = createLineItems(inputData.cart?.items!);
      console.log("lineItems: ", lineItems);
      const checkoutParams = createCheckoutParam(lineItems, inputData.basePath);
      console.log("checkoutParams: ", checkoutParams);
      const checkoutSession = await stripeCheckOut(checkoutParams);
      console.log("session: ", checkoutSession);
      return checkoutSession;
    }),
});
