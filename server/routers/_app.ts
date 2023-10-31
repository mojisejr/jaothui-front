import { router } from "../trpc";
import { userRouter } from "./user";
import { farmRouter } from "./farm";
import { buffaloRouter } from "./buffalo";
import { storeRouter } from "./store";
import { privilegeRouter } from "./privilege";

export const appRouter = router({
  user: userRouter,
  farm: farmRouter,
  buffalo: buffaloRouter,
  store: storeRouter,
  privilege: privilegeRouter,
});

export type AppRouter = typeof appRouter;
