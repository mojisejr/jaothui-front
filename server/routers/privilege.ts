import { getAllPriviledge, getPrivilegeById } from "../services/privilege.service";
import { router } from "../trpc";
import { publicProcedure } from "../trpc";
import { z } from "zod";

export const privilegeRouter = router({
  get: publicProcedure
    .query(async ({ ctx }) => {
      return await getAllPriviledge(); 
    }),
  getById: publicProcedure.input(z.object({
    _id: z.string(),
  })).query(async ({ctx, input}) => {
    return await getPrivilegeById(input._id);
  }),
});
