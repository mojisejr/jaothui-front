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

export type MobileAccountProvider = "line" | "apple" | "reviewer";

type MobileLinkedWalletPayload = {
  walletAddress: string;
  provider: "bitkub-next";
  email: string | null;
};

export type MobileAccountSessionPayload = {
  typ: typeof SESSION_TOKEN_TYPE;
  sessionVersion: 2;
  accountId: string;
  primaryProvider: MobileAccountProvider;
  providerUserId: string;
  lineUserId?: string;
  appleUserId?: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  linkedWallet: MobileLinkedWalletPayload | null;
  iat?: number;
  exp?: number;
};

export type MobileLineAccountSessionPayload = MobileAccountSessionPayload & {
  primaryProvider: "line";
  lineUserId: string;
};

export type MobileAppleAccountSessionPayload = MobileAccountSessionPayload & {
  primaryProvider: "apple";
  appleUserId: string;
};

export type MobileReviewerAccountSessionPayload = MobileAccountSessionPayload & {
  primaryProvider: "reviewer";
};

export type MobileCustomerAccountSessionPayload =
  | MobileLineAccountSessionPayload
  | MobileAppleAccountSessionPayload;

export type MobileSessionPayload =
  | MobileBitkubNextSessionPayload
  | MobileAccountSessionPayload;

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
  linkedWallet?: MobileAccountSessionPayload["linkedWallet"];
}) {
  return createMobileAccountSession({
    accountId: input.accountId,
    primaryProvider: "line",
    providerUserId: input.lineUserId,
    email: input.email,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    linkedWallet: input.linkedWallet,
  });
}

export function createMobileAccountSession(input: {
  accountId: string;
  primaryProvider: MobileAccountProvider;
  providerUserId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  linkedWallet?: MobileAccountSessionPayload["linkedWallet"];
}) {
  const accountId = input.accountId.trim();
  const providerUserId = input.providerUserId.trim();
  if (!accountId) {
    throw new Error("accountId is required");
  }
  if (
    input.primaryProvider !== "line" &&
    input.primaryProvider !== "apple" &&
    input.primaryProvider !== "reviewer"
  ) {
    throw new Error("Unsupported mobile account provider");
  }
  if (!providerUserId) {
    throw new Error("providerUserId is required");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = nowSeconds + SESSION_TTL_SECONDS;
  const payload: Omit<MobileAccountSessionPayload, "iat" | "exp"> = {
    typ: SESSION_TOKEN_TYPE,
    sessionVersion: 2,
    accountId,
    primaryProvider: input.primaryProvider,
    providerUserId,
    ...(input.primaryProvider === "line" ? { lineUserId: providerUserId } : {}),
    ...(input.primaryProvider === "apple" ? { appleUserId: providerUserId } : {}),
    email: input.email ?? null,
    displayName: input.displayName ?? null,
    avatarUrl: input.avatarUrl ?? null,
    // A reviewer session is deliberately non-financial. Its wallet state is
    // supplied by the reviewer-only fixture API, never by an account wallet.
    linkedWallet: input.primaryProvider === "reviewer" ? null : input.linkedWallet ?? null,
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

export function createMobileReviewerAccountSession(input: {
  accountId: string;
  providerUserId: string;
  displayName?: string | null;
}) {
  return createMobileAccountSession({
    accountId: input.accountId,
    primaryProvider: "reviewer",
    providerUserId: input.providerUserId,
    displayName: input.displayName ?? "JAOTHUI Reviewer Sandbox",
    linkedWallet: null,
  });
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

function verifyAccountPayload(decoded: Record<string, any>) {
  const primaryProvider = decoded.primaryProvider;
  const providerUserId =
    typeof decoded.providerUserId === "string" && decoded.providerUserId.trim()
      ? decoded.providerUserId
      : primaryProvider === "line" && typeof decoded.lineUserId === "string"
        ? decoded.lineUserId
        : primaryProvider === "apple" && typeof decoded.appleUserId === "string"
          ? decoded.appleUserId
          : null;

  if (
    decoded.sessionVersion !== 2 ||
    (primaryProvider !== "line" &&
      primaryProvider !== "apple" &&
      primaryProvider !== "reviewer") ||
    typeof decoded.accountId !== "string" ||
    !decoded.accountId.trim() ||
    typeof providerUserId !== "string" ||
    !providerUserId.trim()
  ) {
    throw new Error("Invalid mobile session token");
  }

  const linkedWallet = decoded.linkedWallet;
  if (primaryProvider === "reviewer" && linkedWallet !== null && linkedWallet !== undefined) {
    throw new Error("Invalid mobile session token");
  }
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

  const payload = {
    typ: decoded.typ,
    sessionVersion: 2,
    accountId: decoded.accountId,
    primaryProvider,
    providerUserId,
    ...(primaryProvider === "line" ? { lineUserId: providerUserId } : {}),
    ...(primaryProvider === "apple" ? { appleUserId: providerUserId } : {}),
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
  } satisfies MobileAccountSessionPayload;

  return payload;
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
    return verifyAccountPayload(decoded as Record<string, any>);
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

export function requireMobileLineAccountSession(req: NextApiRequest) {
  const session = requireMobileAccountSession(req);
  if (!session) return null;
  if (session.primaryProvider !== "line") {
    throw new Error("Invalid mobile session token");
  }
  return session as MobileLineAccountSessionPayload;
}

export function requireMobileReviewerAccountSession(req: NextApiRequest) {
  const session = requireMobileAccountSession(req);
  if (!session) return null;
  if (session.primaryProvider !== "reviewer") {
    throw new Error("Invalid mobile session token");
  }
  return session as MobileReviewerAccountSessionPayload;
}

/** Customer-only flows such as Bitkub linking must never accept reviewer JWTs. */
export function requireMobileCustomerAccountSession(req: NextApiRequest) {
  const session = requireMobileAccountSession(req);
  if (!session) return null;
  if (session.primaryProvider !== "line" && session.primaryProvider !== "apple") {
    throw new Error("Invalid mobile session token");
  }
  return session as MobileCustomerAccountSessionPayload;
}

export function requireMobileAccountSession(req: NextApiRequest) {
  const session = requireMobileSession(req);
  if (!session) return null;
  if (!("primaryProvider" in session)) {
    throw new Error("Invalid mobile session token");
  }
  return session;
}
