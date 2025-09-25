import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import jwt from "jsonwebtoken";
import { getCookie } from "cookies-next";

export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  // Verify our HttpOnly session cookie instead of public header secret.
  const auth = async (): Promise<boolean> => {
    // session_token is our server-issued JWT set in pages/api/auth/token.ts
    const token = getCookie("session_token", { req, res });
    if (!token || typeof token !== "string") return false;

    try {
      const verify = jwt.verify(token, process.env.private_procedure_secret as string);
      return Boolean(verify);
    } catch (_e) {
      return false;
    }
  };

  const isAuth = await auth();

  return {
    isAuth,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
