import { router } from "../trpc";
import { userRouter } from "./user";
import { farmRouter } from "./farm";
import { buffaloRouter } from "./buffalo";

export const appRouter = router({
  user: userRouter,
  farm: farmRouter,
  buffalo: buffaloRouter,
});

export type AppRouter = typeof appRouter;
