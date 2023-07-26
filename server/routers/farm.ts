import { getFarmByWallet, createFarmByWallet } from "../services/farm.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const farmRouter = router({
  create: publicProcedure
    .input(z.object({ wallet: z.string() }))
    .mutation(async ({ input }) => {
      const created = await createFarmByWallet(input);
      return created;
    }),
  get: publicProcedure
    .input(z.object({ wallet: z.string() }))
    .query(async ({ input }) => {
      const data = await getFarmByWallet(input);
      return data;
    }),
});
