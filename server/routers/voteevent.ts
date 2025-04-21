import {
  getAllVoteListForUser,
  getEventLeaderboard,
  getUserToVoteByEvent,
  isEventActive,
  voteFor,
} from "../services/event.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const voteEventRouter = router({
  isEventActive: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await isEventActive(input);
  }),
  getVoteEventByUser: publicProcedure
    .input(z.object({ wallet: z.string(), eventId: z.string() }))
    .query(async ({ input }) => {
      return await getAllVoteListForUser(input.wallet, input.eventId);
    }),
  getUserToVoteByEvent: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getUserToVoteByEvent(input.wallet, input.eventId);
    }),
  getLeaderboard: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getEventLeaderboard(input.eventId);
    }),
  voteFor: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
        eventId: z.string(),
        microchip: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await voteFor(input.microchip, input.wallet, input.eventId);
    }),
});
