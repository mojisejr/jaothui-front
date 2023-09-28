import { publicProcedure, router } from "../trpc";
import { getProducts } from "../services/store.service";
import { TRPCError } from "@trpc/server";

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
});
