import {
  getAllMetadata,
  getMetadataByMicrochipId,
} from "../services/metadata.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const metadataRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const metadata = await getAllMetadata();
    return metadata;
  }),
  getByMicrochip: publicProcedure
    .input(z.object({ microchip: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getMetadataByMicrochipId(input.microchip);
    }),
});
