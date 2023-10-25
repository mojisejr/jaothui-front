import {
  getAllPriviledge,
  getPrivilegeById,
  getRedeemedTokenByWallet,
  saveRedeemData,
} from "../services/privilege.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const privilegeRouter = router({
  get: publicProcedure.query(async ({ ctx }) => {
    return await getAllPriviledge();
  }),

  getById: publicProcedure
    .input(
      z.object({
        _id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getPrivilegeById(input._id);
    }),

  getUsedTokens: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        privilegeId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getRedeemedTokenByWallet(input.wallet, input.privilegeId);
    }),
  redeem: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        tokenId: z.string(),
        redeemInfo: z.string(),
        isRedeemed: z.boolean(),
        privilege: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await saveRedeemData(input);
    }),
});
