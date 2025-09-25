import { getFarmByWallet, createFarmByWallet } from "../services/farm.service";
import { router } from "../trpc";
import { privateProcedure } from "../trpc";
import { z } from "zod";

export const farmRouter = router({
  create: privateProcedure
    .input(z.object({ wallet: z.string() }))
    .mutation(async ({ input }) => {
      const created = await createFarmByWallet(input);
      return created;
    }),
  get: privateProcedure
    .input(z.object({ wallet: z.string() }))
    .query(async ({ input }) => {
      const data = await getFarmByWallet(input);
      return data;
    }),
});
