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
  checkout: publicProcedure
    .input(
      z.object({ items: z.array(ItemInCartInput), basePath: z.string().url() })
    )
    .mutation(async ({ ctx, input }) => {
      const lineItems = createLineItems(input.items);
      // console.log("lineItems: ", lineItems);
      const checkoutParams = createCheckoutParam(lineItems, input.basePath);
      // console.log("checkoutParams: ", checkoutParams);
      const checkoutSession = await stripeCheckOut(checkoutParams);
      // console.log("session: ", checkoutSession);
      return checkoutSession;
    }),
});
