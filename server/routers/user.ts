import { registerUser } from "../services/user.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const userRouter = router({
  create: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        name: z.string().nullable(),
        tel: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const data = await registerUser(input);
      return data;
    }),
});
