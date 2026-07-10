import jwt from "jsonwebtoken";
import type { NextApiRequest } from "next";

const SESSION_TOKEN_TYPE = "jaothui-mobile-session";
const SESSION_AUDIENCE = "jaothui-mobile";
const TOKEN_ISSUER = "jaothui";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

export type MobileSessionPayload = {
  typ: typeof SESSION_TOKEN_TYPE;
  walletAddress: string;
  email: string | null;
  provider: "bitkub-next";
  iat?: number;
  exp?: number;
};

function getMobileSessionSecret() {
  const secret =
    process.env.JAOTHUI_MOBILE_AUTH_SECRET || process.env.private_procedure_secret;

  if (!secret) {
    throw new Error("Missing JAOTHUI mobile session signing secret");
  }

  return secret;
}

export function createMobileSession(input: {
  walletAddress: string;
  email?: string | null;
}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + SESSION_TTL_SECONDS;
  const payload: Omit<MobileSessionPayload, "iat" | "exp"> = {
    typ: SESSION_TOKEN_TYPE,
    walletAddress: input.walletAddress,
    email: input.email ?? null,
    provider: "bitkub-next",
  };

  const token = jwt.sign(
    {
      ...payload,
      exp: expiresAt,
    },
    getMobileSessionSecret(),
    {
      algorithm: "HS256",
      audience: SESSION_AUDIENCE,
      issuer: TOKEN_ISSUER,
    }
  );

  return {
    token,
    expiresAt,
  };
}

export function verifyMobileSessionToken(token: string): MobileSessionPayload {
  const decoded = jwt.verify(token, getMobileSessionSecret(), {
    algorithms: ["HS256"],
    audience: SESSION_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== SESSION_TOKEN_TYPE ||
    decoded.provider !== "bitkub-next" ||
    typeof decoded.walletAddress !== "string"
  ) {
    throw new Error("Invalid mobile session token");
  }

  return {
    typ: decoded.typ,
    walletAddress: decoded.walletAddress,
    email: typeof decoded.email === "string" ? decoded.email : null,
    provider: decoded.provider,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export function getBearerToken(req: NextApiRequest) {
  const header = req.headers.authorization;
  if (!header || Array.isArray(header)) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export function requireMobileSession(req: NextApiRequest) {
  const token = getBearerToken(req);
  if (!token) return null;
  return verifyMobileSessionToken(token);
}
