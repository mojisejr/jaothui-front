import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { setCookie } from "cookies-next";
import { getUserData } from "../../../helpers/getUserData";

interface TokenRequestBody {
  access_token: string;
  refresh_token: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

const baseCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  // Use secure cookies only in production to allow local development over HTTP
  secure: process.env.NODE_ENV === "production",
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
    return;
  }

  const { access_token, refresh_token } = req.body as TokenRequestBody;
  if (!access_token || !refresh_token) {
    res.status(400).json({ success: false, message: "Missing tokens" });
    return;
  }

  try {
    // 1) Validate BitkubNext access token by fetching user data.
    const user = await getUserData(access_token);
    if (!user.success || !user.wallet_address) {
      res.status(401).json({ success: false, message: "Invalid access token" });
      return;
    }

    const wallet = user.wallet_address;

    // 2) Issue our own short-lived session JWT containing only the wallet.
    const payload = { wallet };
    const sessionToken = jwt.sign(payload, process.env.private_procedure_secret as string, {
      algorithm: "HS256",
      expiresIn: "1d",
      issuer: "jaothui",
      audience: "jaothui-user",
    });

    // 3) Set HttpOnly cookies so the browser sends them automatically; JS can't read them.
    setCookie("access_token", access_token, {
      req,
      res,
      ...baseCookieOptions,
      httpOnly: true,
      // Access token short-lived
      maxAge: 60 * 60 * 24, // 1 day in seconds
    });
    setCookie("refresh_token", refresh_token, {
      req,
      res,
      ...baseCookieOptions,
      httpOnly: true,
      // Refresh token longer-lived
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });
    // Wallet address is not sensitive; expose to client-side for convenience (not HttpOnly)
    setCookie("wallet", wallet, {
      req,
      res,
      ...baseCookieOptions,
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    });
    setCookie("session_token", sessionToken, {
      req,
      res,
      ...baseCookieOptions,
      httpOnly: true,
      // Session cookie lifespan matches JWT expiry
      maxAge: 60 * 60 * 24, // 1 day in seconds
    });

    res.status(200).json({ success: true, message: "Session established" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}