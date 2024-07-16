import { getMemberData } from "../services/kwaithai.service";
import { getJaothuiProfileAll } from "../services/nft-profile.service";
import {
  getJaothuiPointOf,
  hasUser,
  registerUser,
  updateUserPoint,
} from "../services/user.service";
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
  kGetMember: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getMemberData(input.wallet);
    }),
  getJaothuiProfileAll: publicProcedure
    .input(z.object({ wallet: z.string() }))
    .query(async ({ input }) => {
      return await getJaothuiProfileAll(input.wallet);
    }),
  updateUserPoint: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        point: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateUserPoint(input.wallet, input.point);
    }),
  getJaothuiPointOf: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getJaothuiPointOf(input.wallet);
    }),
});
