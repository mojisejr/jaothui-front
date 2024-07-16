import { TRPCError } from "@trpc/server";
import {
  getAllJaothuiRedeemItems,
  getAllPriviledge,
  getPrivilegeById,
  getRedeemedTokenByWallet,
  redeemHistoryCreate,
  saveRedeemData,
} from "../services/privilege.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { string, z } from "zod";

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
      const response = await saveRedeemData(input);
      if (response == undefined)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Token #${input.tokenId} already claimed`,
        });
      return response;
    }),
  getAllJaothuiRedeemItems: publicProcedure.query(async () => {
    return await getAllJaothuiRedeemItems();
  }),
  redeemHistoryCreate: publicProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        tel: z.string(),
        timestamp: z.string(),
        wallet: z.string(),
        redeemItem: z.string(),
        redeemedPoint: z.number(),
        redeemedItemName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await redeemHistoryCreate({ ...input, timestamp: new Date() });
    }),
});
