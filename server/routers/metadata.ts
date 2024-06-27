import {
  getAllMetadata,
  getMetadataByMicrochipId,
} from "../services/metadata.service";
import { getCertificateImageOf } from "../services/renderer.service";
// import { renderPedigree } from "../services/renderer.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const metadataRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const metadata = await getAllMetadata();
    return metadata;
  }),
  getByMicrochip: publicProcedure
    .input(z.object({ microchip: z.string(), tokenId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getMetadataByMicrochipId(input.microchip, input.tokenId);
    }),
  renderPedigree: publicProcedure
    .input(z.object({ microchip: z.string(), tokenId: z.string() }))
    .query(async ({ input }) => {
      return await getCertificateImageOf(input.microchip, input.tokenId);
    }),
});
