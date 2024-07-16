import { z } from "zod";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import {
  getAllGames,
  getNFTInGame,
  pointUpdate,
  resetPointByRound,
} from "../services/game.service";

export const gameRouter = router({
  getAllGame: publicProcedure.query(async () => {
    return await getAllGames();
  }),
  getNftInGame: publicProcedure
    .input(
      z.object({
        tokenId: z.string(),
        gameId: z.string(),
        contractAddress: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await getNFTInGame(
        input.gameId,
        input.tokenId,
        input.contractAddress
      );
    }),
  resetPointByRound: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        contractAddress: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await resetPointByRound(input.gameId, input.contractAddress);
    }),
  updatePoint: publicProcedure
    .input(
      z.object({
        docId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await pointUpdate(input.docId);
    }),
});
