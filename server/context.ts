import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import jwt from "jsonwebtoken";

export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  const auth = async () => {
    if (req.headers.authorization) {
      const verify = jwt.verify(
        req.headers.authorization.split(" ")[1],
        process.env.private_procedure_secret!
      );

      if (verify == null) {
        return false;
      }

      if (verify == undefined) {
        return false;
      }

      if (verify) {
        return true;
      }
    }
  };

  const isAuth = await auth();

  return {
    isAuth,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
