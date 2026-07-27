import { createPublicKey } from "crypto";
import jwt from "jsonwebtoken";

import {
  attachIdentityToAccount,
  findOrCreateAccountIdentity,
  getLinkedWallet,
  AccountIdentityConflictError,
  type AccountServiceClient,
} from "../services/account.service";

const APPLE_PROVIDER = "apple";
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
const DEFAULT_IOS_BUNDLE_ID = "com.jaothui.mobile";
const APPLE_KEYS_CACHE_MS = 60 * 60 * 1000;

type AppleJwk = {
  kid: string;
  alg: string;
  kty: string;
  use?: string;
  n?: string;
  e?: string;
};

type AppleJwks = {
  keys: AppleJwk[];
};

export type VerifiedAppleIdentity = {
  providerUserId: string;
  email: string | null;
  emailVerified: boolean | null;
};

export type AppleAuthSessionInput = {
  identityToken: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  attachToAccountId?: string | null;
  client?: AccountServiceClient;
  verifier?: (identityToken: string) => Promise<VerifiedAppleIdentity>;
};

let cachedAppleKeys: { expiresAt: number; keys: AppleJwk[] } | null = null;

function getAppleAudience() {
  return (
    process.env.JAOTHUI_MOBILE_APPLE_CLIENT_ID ||
    process.env.JAOTHUI_IOS_BUNDLE_ID ||
    DEFAULT_IOS_BUNDLE_ID
  );
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function fetchAppleKeys(): Promise<AppleJwk[]> {
  if (cachedAppleKeys && cachedAppleKeys.expiresAt > Date.now()) {
    return cachedAppleKeys.keys;
  }

  const response = await fetch(APPLE_JWKS_URL, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to fetch Apple public keys");
  }

  const payload = (await response.json()) as AppleJwks;
  if (!Array.isArray(payload.keys)) {
    throw new Error("Invalid Apple public keys response");
  }

  cachedAppleKeys = {
    expiresAt: Date.now() + APPLE_KEYS_CACHE_MS,
    keys: payload.keys,
  };
  return payload.keys;
}

function toPublicKeyPem(jwk: AppleJwk) {
  return createPublicKey({
    key: jwk as any,
    format: "jwk",
  }).export({
    type: "spki",
    format: "pem",
  });
}

function toEmailVerified(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return null;
}

export async function verifyAppleIdentityToken(
  identityToken: string
): Promise<VerifiedAppleIdentity> {
  const decoded = jwt.decode(identityToken, { complete: true }) as
    | { header?: { kid?: unknown; alg?: unknown } }
    | null;

  const kid = decoded?.header?.kid;
  if (typeof kid !== "string" || !kid.trim()) {
    throw new Error("Invalid Apple identity token header");
  }

  const keys = await fetchAppleKeys();
  const key = keys.find((candidate) => candidate.kid === kid);
  if (!key) {
    throw new Error("Apple public key not found");
  }

  const payload = jwt.verify(identityToken, toPublicKeyPem(key), {
    algorithms: ["RS256"],
    issuer: APPLE_ISSUER,
    audience: getAppleAudience(),
  }) as jwt.JwtPayload;

  if (typeof payload.sub !== "string" || !payload.sub.trim()) {
    throw new Error("Apple identity token is missing subject");
  }

  return {
    providerUserId: payload.sub,
    email: nullableString(payload.email),
    emailVerified: toEmailVerified(payload.email_verified),
  };
}

export async function createAppleAccountSessionIdentity(input: AppleAuthSessionInput) {
  const verifier = input.verifier ?? verifyAppleIdentityToken;
  const verified = await verifier(input.identityToken);
  const email = normalizeAppleEmail(input.email ?? verified.email);
  const displayName = nullableString(input.displayName);
  const avatarUrl = nullableString(input.avatarUrl);
  const client = input.client;

  const account = input.attachToAccountId
    ? await attachIdentityToAccount(
        input.attachToAccountId,
        {
          provider: APPLE_PROVIDER,
          providerUserId: verified.providerUserId,
          email,
          displayName,
          avatarUrl,
        },
        client
      )
    : await findOrCreateAccountIdentity(
        {
          provider: APPLE_PROVIDER,
          providerUserId: verified.providerUserId,
          email,
          displayName,
          avatarUrl,
        },
        client
      );

  const linkedWallet = await getLinkedWallet(account.id, client);

  return {
    account,
    providerUserId: verified.providerUserId,
    email,
    displayName,
    avatarUrl,
    linkedWallet: linkedWallet
      ? {
          walletAddress: linkedWallet.walletAddress,
          provider: "bitkub-next" as const,
          email: nullableString(linkedWallet.email),
        }
      : null,
  };
}

function normalizeAppleEmail(value: unknown) {
  return nullableString(value);
}

export function toMobileAppleAuthErrorCode(error: unknown) {
  if (error instanceof AccountIdentityConflictError) {
    return "ACCOUNT_IDENTITY_ALREADY_LINKED";
  }
  if (error instanceof Error && /token|apple|jwt|issuer|audience|subject|key/i.test(error.message)) {
    return "INVALID_APPLE_IDENTITY_TOKEN";
  }
  return "APPLE_AUTH_FAILED";
}
