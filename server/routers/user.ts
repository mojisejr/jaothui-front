import { hasUser, registerUser } from "../services/user.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const userRouter = router({
  create: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        email: z.string().nullable(),
        name: z.string().nullable(),
        tel: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const foundUser = await hasUser(input.wallet);
      if (foundUser) {
        return;
      } else {
        const data = await registerUser(input);
        return data;
      }
    }),
});
