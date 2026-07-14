import jwt from "jsonwebtoken";
import { getCookie, setCookie } from "cookies-next";
import type { NextApiRequest, NextApiResponse } from "next";
import type { GetServerSidePropsContext } from "next";

export const LINE_WEB_SESSION_COOKIE = "jaothui_line_session";

const SESSION_TOKEN_TYPE = "jaothui-web-line-session";
const SESSION_AUDIENCE = "jaothui-web-v2";
const TOKEN_ISSUER = "jaothui";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

type CookieContext = {
  req: NextApiRequest | GetServerSidePropsContext["req"];
  res: NextApiResponse | GetServerSidePropsContext["res"];
};

export type LineWebSessionPayload = {
  typ: typeof SESSION_TOKEN_TYPE;
  sessionVersion: 1;
  accountId: string;
  primaryProvider: "line";
  lineUserId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  linkedWallet: {
    walletAddress: string;
    provider: "bitkub-next";
    email: string | null;
  } | null;
  iat?: number;
  exp?: number;
};

function getLineWebSessionSecret() {
  const secret =
    process.env.JAOTHUI_WEB_AUTH_SECRET ||
    process.env.JAOTHUI_MOBILE_AUTH_SECRET ||
    process.env.private_procedure_secret;

  if (!secret) {
    throw new Error("Missing JAOTHUI web auth signing secret");
  }

  return secret;
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

export function createLineWebSession(input: {
  accountId: string;
  lineUserId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  linkedWallet?: LineWebSessionPayload["linkedWallet"];
}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + SESSION_TTL_SECONDS;
  const payload: Omit<LineWebSessionPayload, "iat" | "exp"> = {
    typ: SESSION_TOKEN_TYPE,
    sessionVersion: 1,
    accountId: normalizeRequired(input.accountId, "accountId"),
    primaryProvider: "line",
    lineUserId: normalizeRequired(input.lineUserId, "lineUserId"),
    email: input.email ?? null,
    displayName: input.displayName ?? null,
    avatarUrl: input.avatarUrl ?? null,
    linkedWallet: input.linkedWallet ?? null,
  };

  const token = jwt.sign(
    {
      ...payload,
      exp: expiresAt,
    },
    getLineWebSessionSecret(),
    {
      algorithm: "HS256",
      audience: SESSION_AUDIENCE,
      issuer: TOKEN_ISSUER,
    }
  );

  return {
    token,
    expiresAt,
    payload,
  };
}

export function verifyLineWebSessionToken(token: string): LineWebSessionPayload {
  const decoded = jwt.verify(token, getLineWebSessionSecret(), {
    algorithms: ["HS256"],
    audience: SESSION_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== SESSION_TOKEN_TYPE ||
    decoded.sessionVersion !== 1 ||
    decoded.primaryProvider !== "line" ||
    typeof decoded.accountId !== "string" ||
    !decoded.accountId.trim() ||
    typeof decoded.lineUserId !== "string" ||
    !decoded.lineUserId.trim()
  ) {
    throw new Error("Invalid LINE web session token");
  }

  const linkedWallet = decoded.linkedWallet;
  if (linkedWallet !== null && linkedWallet !== undefined) {
    if (
      typeof linkedWallet !== "object" ||
      linkedWallet.provider !== "bitkub-next" ||
      typeof linkedWallet.walletAddress !== "string" ||
      !linkedWallet.walletAddress.trim()
    ) {
      throw new Error("Invalid LINE web session token");
    }
  }

  return {
    typ: decoded.typ,
    sessionVersion: 1,
    accountId: decoded.accountId,
    primaryProvider: "line",
    lineUserId: decoded.lineUserId,
    email: nullableString(decoded.email),
    displayName: nullableString(decoded.displayName),
    avatarUrl: nullableString(decoded.avatarUrl),
    linkedWallet:
      linkedWallet && typeof linkedWallet === "object"
        ? {
            walletAddress: linkedWallet.walletAddress,
            provider: "bitkub-next",
            email: nullableString(linkedWallet.email),
          }
        : null,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export function setLineWebSessionCookie(
  ctx: CookieContext,
  token: string,
  maxAge = SESSION_TTL_SECONDS
) {
  setCookie(LINE_WEB_SESSION_COOKIE, token, {
    req: ctx.req,
    res: ctx.res,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  });
}

export function clearLineWebSessionCookie(ctx: CookieContext) {
  setCookie(LINE_WEB_SESSION_COOKIE, "", {
    req: ctx.req,
    res: ctx.res,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
  });
}

export function getLineWebSessionFromRequest(ctx: CookieContext) {
  const token = getCookie(LINE_WEB_SESSION_COOKIE, {
    req: ctx.req,
    res: ctx.res,
  });
  if (typeof token !== "string" || !token) {
    return null;
  }

  return verifyLineWebSessionToken(token);
}
