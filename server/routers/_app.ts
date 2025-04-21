import { router } from "../trpc";
import { userRouter } from "./user";
import { farmRouter } from "./farm";
import { buffaloRouter } from "./buffalo";
import { storeRouter } from "./store";
import { privilegeRouter } from "./privilege";
import { metadataRouter } from "./metadata";
import { gameRouter } from "./game";
import { voteEventRouter } from "./voteevent";

export const appRouter = router({
  user: userRouter,
  farm: farmRouter,
  buffalo: buffaloRouter,
  store: storeRouter,
  privilege: privilegeRouter,
  metadata: metadataRouter,
  game: gameRouter,
  voteEvent: voteEventRouter,
});

export type AppRouter = typeof appRouter;
