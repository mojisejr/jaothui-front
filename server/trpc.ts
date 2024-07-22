import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(async (opts) => {
  const { isAuth } = opts.ctx;

  if (!isAuth) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next();
});
