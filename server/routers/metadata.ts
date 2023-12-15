import { getMetadataByMicrochipId } from "../services/metadata.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const metadataRouter = router({
  getByMicrochip: publicProcedure
    .input(z.object({ microchip: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getMetadataByMicrochipId(input.microchip);
    }),
});
