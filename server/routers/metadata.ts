import {
  getAllMetadata,
  getMetadataByMicrochip,
  getMetadataBatch,
  searchByKeyword,
} from "../services/metadata.service";
import { renderPedigree } from "../renderer";
import {
  gerRewardByMicrochip,
  getRewardById,
} from "../services/reward.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const metadataRouter = router({
  getAll: publicProcedure.input(z.number()).query(async ({ ctx, input }) => {
    const metadata = await getAllMetadata(input);
    return metadata;
  }),
  getBatch: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      const metadata = await getMetadataBatch(input);
      return metadata;
    }),
  getByMicrochip: publicProcedure
    .input(z.object({ microchip: z.string() }))
    .query(async ({ ctx, input }) => {
      const metadata = await getMetadataByMicrochip(input.microchip);
      
      if (!metadata) {
        throw new Error(`Metadata not found for microchip: ${input.microchip}`);
      }
      
      return metadata;
    }),
  searchByKeyword: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await searchByKeyword(input);
    }),
  // .input(z.object({ microchip: z.string(), tokenId: z.number() }))
  // .query(async ({ ctx, input }) => {
  //   return await getMetadataByMicrochipId(input.microchip, input.tokenId);
  // }),
  renderPedigree: publicProcedure
    .input(z.object({ microchip: z.string(), tokenId: z.string() }))
    .query(async ({ input }) => {
      return await renderPedigree(input.microchip, input.tokenId);
    }),
  getRewardByMicrochip: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await gerRewardByMicrochip(input);
    }),
  getRewardById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await getRewardById(input);
  }),
});
