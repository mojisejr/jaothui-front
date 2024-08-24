import {
  getAllMetadata,
  getMetadataByMicrochipId,
  getMetadataByMicrochip,
  getTotalSupply,
  getMetadataBatch,
} from "../services/metadata.service";
import { getCertificateImageOf } from "../services/renderer.service";
// import { renderPedigree } from "../services/renderer.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const metadataRouter = router({
  totalSupply: publicProcedure.query(async () => {
    return await getTotalSupply();
  }),
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
      return await getMetadataByMicrochip(input.microchip);
    }),
  // .input(z.object({ microchip: z.string(), tokenId: z.number() }))
  // .query(async ({ ctx, input }) => {
  //   return await getMetadataByMicrochipId(input.microchip, input.tokenId);
  // }),
  renderPedigree: publicProcedure
    .input(z.object({ microchip: z.string(), tokenId: z.string() }))
    .query(async ({ input }) => {
      return await getCertificateImageOf(input.microchip, input.tokenId);
    }),
});
