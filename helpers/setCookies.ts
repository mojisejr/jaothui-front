import { setCookie } from "cookies-next";

const cookieOptions = {
  path: "/",
  sameSite: "lax" as "lax",
  secure: true,
  httpOnly: process.env.production == "PROD" ? true : false,
  expires: new Date(Date.now() + 60 * 60 * 24),
  maxAge: 60 * 60 * 24 * 7,
};

export function setCookies(
  accessToken: string,
  refreshToken: string,
  wallet: string
) {
  setCookie("access_token", accessToken, cookieOptions);
  setCookie("refresh_token", refreshToken, cookieOptions);
  setCookie("wallet", wallet, cookieOptions);
}
