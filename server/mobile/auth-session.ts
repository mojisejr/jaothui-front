import jwt from "jsonwebtoken";
import type { NextApiRequest } from "next";

const SESSION_TOKEN_TYPE = "jaothui-mobile-session";
const SESSION_AUDIENCE = "jaothui-mobile";
const TOKEN_ISSUER = "jaothui";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

export type MobileBitkubNextSessionPayload = {
  typ: typeof SESSION_TOKEN_TYPE;
  sessionVersion?: 1;
  walletAddress: string;
  email: string | null;
  provider: "bitkub-next";
  iat?: number;
  exp?: number;
};

export type MobileLineAccountSessionPayload = {
  typ: typeof SESSION_TOKEN_TYPE;
  sessionVersion: 2;
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

export type MobileSessionPayload =
  | MobileBitkubNextSessionPayload
  | MobileLineAccountSessionPayload;

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
  const payload: Omit<MobileBitkubNextSessionPayload, "iat" | "exp"> = {
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

export function createMobileLineAccountSession(input: {
  accountId: string;
  lineUserId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  linkedWallet?: MobileLineAccountSessionPayload["linkedWallet"];
}) {
  const accountId = input.accountId.trim();
  const lineUserId = input.lineUserId.trim();
  if (!accountId) {
    throw new Error("accountId is required");
  }
  if (!lineUserId) {
    throw new Error("lineUserId is required");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + SESSION_TTL_SECONDS;
  const payload: Omit<MobileLineAccountSessionPayload, "iat" | "exp"> = {
    typ: SESSION_TOKEN_TYPE,
    sessionVersion: 2,
    accountId,
    primaryProvider: "line",
    lineUserId,
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

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function verifyBitkubNextPayload(decoded: Record<string, any>) {
  if (
    decoded.sessionVersion !== undefined &&
    decoded.sessionVersion !== 1
  ) {
    throw new Error("Invalid mobile session token");
  }

  if (
    decoded.provider !== "bitkub-next" ||
    typeof decoded.walletAddress !== "string" ||
    !decoded.walletAddress.trim()
  ) {
    throw new Error("Invalid mobile session token");
  }

  return {
    typ: decoded.typ,
    sessionVersion: decoded.sessionVersion,
    walletAddress: decoded.walletAddress,
    email: nullableString(decoded.email),
    provider: decoded.provider,
    iat: decoded.iat,
    exp: decoded.exp,
  } satisfies MobileBitkubNextSessionPayload;
}

function verifyLineAccountPayload(decoded: Record<string, any>) {
  if (
    decoded.sessionVersion !== 2 ||
    decoded.primaryProvider !== "line" ||
    typeof decoded.accountId !== "string" ||
    !decoded.accountId.trim() ||
    typeof decoded.lineUserId !== "string" ||
    !decoded.lineUserId.trim()
  ) {
    throw new Error("Invalid mobile session token");
  }

  const linkedWallet = decoded.linkedWallet;
  if (linkedWallet !== null && linkedWallet !== undefined) {
    if (
      typeof linkedWallet !== "object" ||
      linkedWallet.provider !== "bitkub-next" ||
      typeof linkedWallet.walletAddress !== "string" ||
      !linkedWallet.walletAddress.trim()
    ) {
      throw new Error("Invalid mobile session token");
    }
  }

  return {
    typ: decoded.typ,
    sessionVersion: 2,
    accountId: decoded.accountId,
    primaryProvider: decoded.primaryProvider,
    lineUserId: decoded.lineUserId,
    email: nullableString(decoded.email),
    displayName: nullableString(decoded.displayName),
    avatarUrl: nullableString(decoded.avatarUrl),
    linkedWallet:
      linkedWallet && typeof linkedWallet === "object"
        ? {
            walletAddress: linkedWallet.walletAddress,
            provider: linkedWallet.provider,
            email: nullableString(linkedWallet.email),
          }
        : null,
    iat: decoded.iat,
    exp: decoded.exp,
  } satisfies MobileLineAccountSessionPayload;
}

export function verifyMobileSessionToken(token: string): MobileSessionPayload {
  const decoded = jwt.verify(token, getMobileSessionSecret(), {
    algorithms: ["HS256"],
    audience: SESSION_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== SESSION_TOKEN_TYPE
  ) {
    throw new Error("Invalid mobile session token");
  }

  if ((decoded as Record<string, any>).sessionVersion === 2) {
    return verifyLineAccountPayload(decoded as Record<string, any>);
  }

  return verifyBitkubNextPayload(decoded as Record<string, any>);
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

export function requireMobileBitkubNextSession(req: NextApiRequest) {
  const session = requireMobileSession(req);
  if (!session) return null;
  if (!("provider" in session) || session.provider !== "bitkub-next") {
    throw new Error("Invalid mobile session token");
  }
  return session;
}
