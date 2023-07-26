import { z } from "zod";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import {
  createBuffaloByFarmId,
  getBuffaloByMicrochip,
  markBuffaloAsDead,
  markBuffaloAsOvulation,
  markBuffaloAsPregnant,
  markBuffaloAsSold,
  markBuffaloAsUnpregnant,
} from "../services/buffalo.service";

export const buffaloRouter = router({
  create: publicProcedure
    .input(
      z.object({
        farmId: z.number(),
        data: z.object({
          microchip: z.string(),
          name: z.string(),
          sex: z.string(),
          height: z.number(),
          color: z.string(),
          details: z.string().nullable(),
          motherId: z.string().nullable(),
          fatherId: z.string().nullable(),
          birthday: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await createBuffaloByFarmId(input.farmId, input.data);
      return result;
    }),
  getByMicrochip: publicProcedure
    .input(z.object({ farmId: z.number(), microchip: z.string() }))
    .query(async ({ input }) => {
      const result = await getBuffaloByMicrochip(input.farmId, input.microchip);
      return result;
    }),
  markAsDead: publicProcedure
    .input(z.object({ buffaloId: z.number() }))
    .mutation(async ({ input }) => {
      const result = await markBuffaloAsDead(input.buffaloId);
      return result;
    }),
  markAsSold: publicProcedure
    .input(z.object({ buffaloId: z.number() }))
    .mutation(async ({ input }) => {
      const result = await markBuffaloAsSold(input.buffaloId);
      return result;
    }),
  markOvul: publicProcedure
    .input(
      z.object({
        buffaloId: z.number(),
        timestamp: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await markBuffaloAsOvulation(
        input.buffaloId,
        input.timestamp
      );
      return result;
    }),
  markPreg: publicProcedure
    .input(
      z.object({
        buffaloId: z.number(),
        timestamp: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await markBuffaloAsPregnant(
        input.buffaloId,
        input.timestamp
      );
      return result;
    }),
  markUnPreg: publicProcedure
    .input(z.object({ buffaloId: z.number(), timestamp: z.string() }))
    .mutation(async ({ input }) => {
      const result = await markBuffaloAsUnpregnant(
        input.buffaloId,
        input.timestamp
      );
      return result;
    }),
});
