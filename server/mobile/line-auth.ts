import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { AuthConfigurationError, InvalidAuthError, verifyAuthJwt } from "../auth/errors";
import { runAuthStage } from "../auth/diagnostics";
import { safeAuthRequestId } from "../auth/request-id";

import {
  buildLineWebAuthorizeUrl,
  exchangeLineAuthorizationCode,
  verifyLineIdToken,
  type LineWebAuthConfig,
  type LineVerifiedProfile,
} from "../auth/line-web-auth";
import {
  findOrCreateLineAccount,
  getLinkedWallet,
  type AccountServiceClient,
} from "../services/account.service";

const STATE_TOKEN_TYPE = "jaothui-mobile-line-oauth-state";
const HANDOFF_TOKEN_TYPE = "jaothui-mobile-line-oauth-handoff";
const MOBILE_LINE_FLOW = "mobile-line";
const STATE_AUDIENCE = "jaothui-mobile-line-oauth";
const HANDOFF_AUDIENCE = "jaothui-mobile-line-handoff";
const TOKEN_ISSUER = "jaothui";
const DEFAULT_LINE_SCOPE = "openid profile";
const MOBILE_NATIVE_CALLBACK_URL = "jaothui://oauth/callback";

type Env = Record<string, string | undefined>;
type FetchLike = typeof fetch;

export type MobileLineOAuthStatePayload = {
  typ: typeof STATE_TOKEN_TYPE;
  flow: typeof MOBILE_LINE_FLOW;
  returnTo: string;
  nonce: string;
  clientFlowId?: string;
  iat?: number;
  exp?: number;
};

export type MobileLineOAuthHandoffPayload = {
  typ: typeof HANDOFF_TOKEN_TYPE;
  flow: typeof MOBILE_LINE_FLOW;
  accountId: string;
  lineUserId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  linkedWallet: {
    walletAddress: string;
    provider: "bitkub-next";
    email: string | null;
  } | null;
  nonce: string;
  clientFlowId?: string;
  iat?: number;
  exp?: number;
};

function getSigningSecret(env: Env = process.env) {
  const secret = env.JAOTHUI_MOBILE_AUTH_SECRET || env.private_procedure_secret;
  if (!secret) {
    throw new AuthConfigurationError("Missing JAOTHUI mobile auth signing secret");
  }
  return secret;
}

function getRequiredEnv(name: keyof Env, env: Env) {
  const value = env[name]?.trim();
  if (!value) {
    throw new AuthConfigurationError(`Missing ${name}`);
  }
  return value;
}

function normalizeLineScope(scope: string | undefined) {
  const normalized = (scope ?? DEFAULT_LINE_SCOPE)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  if (!normalized.includes("openid") || !normalized.includes("profile")) {
    throw new AuthConfigurationError("LINE login scope must include openid and profile");
  }

  return normalized;
}

export function getLineMobileAuthConfig(env: Env = process.env): LineWebAuthConfig {
  return {
    channelId: getRequiredEnv("JAOTHUI_LINE_LOGIN_CHANNEL_ID", env),
    channelSecret: getRequiredEnv("JAOTHUI_LINE_LOGIN_CHANNEL_SECRET", env),
    callbackUrl: getRequiredEnv("JAOTHUI_LINE_MOBILE_CALLBACK_URL", env),
    scope: normalizeLineScope(env.JAOTHUI_LINE_LOGIN_SCOPE),
  };
}

export function normalizeMobileLineReturnTo(returnTo: string) {
  let parsed: URL;
  try { parsed = new URL(returnTo); }
  catch { throw new InvalidAuthError("Unsupported mobile LINE return target"); }

  if (
    parsed.protocol !== "jaothui:" ||
    parsed.hostname !== "oauth" ||
    parsed.pathname !== "/callback" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new InvalidAuthError("Unsupported mobile LINE return target");
  }

  return MOBILE_NATIVE_CALLBACK_URL;
}

/** Opaque client correlation only; never an identity or a return URL. */
export function normalizeMobileLineClientFlowId(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^[a-zA-Z0-9-]{12,96}$/.test(value)) {
    throw new InvalidAuthError("Invalid mobile LINE client flow ID");
  }
  return value;
}

export function createMobileLineOAuthState(
  returnTo: string,
  options: { env?: Env; clientFlowId?: string } = {}
) {
  const payload: Omit<MobileLineOAuthStatePayload, "iat" | "exp"> = {
    typ: STATE_TOKEN_TYPE,
    flow: MOBILE_LINE_FLOW,
    returnTo: normalizeMobileLineReturnTo(returnTo),
    nonce: randomBytes(16).toString("hex"),
    ...(options.clientFlowId === undefined ? {} : { clientFlowId: normalizeMobileLineClientFlowId(options.clientFlowId) }),
  };

  return jwt.sign(payload, getSigningSecret(options.env), {
    algorithm: "HS256",
    audience: STATE_AUDIENCE,
    expiresIn: "10m",
    issuer: TOKEN_ISSUER,
  });
}

export function verifyMobileLineOAuthState(
  state: string,
  options: { env?: Env } = {}
): MobileLineOAuthStatePayload {
  const decoded = verifyAuthJwt(state, getSigningSecret(options.env), {
    algorithms: ["HS256"],
    audience: STATE_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== STATE_TOKEN_TYPE ||
    decoded.flow !== MOBILE_LINE_FLOW ||
    typeof decoded.returnTo !== "string" ||
    typeof decoded.nonce !== "string"
  ) {
    throw new InvalidAuthError("Invalid mobile LINE OAuth state");
  }

  return {
    typ: decoded.typ,
    flow: decoded.flow,
    returnTo: normalizeMobileLineReturnTo(decoded.returnTo),
    nonce: decoded.nonce,
    ...(decoded.clientFlowId === undefined ? {} : { clientFlowId: normalizeMobileLineClientFlowId(decoded.clientFlowId) }),
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export function buildMobileLineAuthorizeUrl(input: {
  state: string;
  nonce: string;
  config?: LineWebAuthConfig;
}) {
  return buildLineWebAuthorizeUrl({
    state: input.state,
    nonce: input.nonce,
    config: input.config ?? getLineMobileAuthConfig(),
  });
}

function mapLinkedWallet(wallet: any): MobileLineOAuthHandoffPayload["linkedWallet"] {
  if (!wallet?.walletAddress) {
    return null;
  }

  return {
    walletAddress: wallet.walletAddress,
    provider: "bitkub-next",
    email: typeof wallet.email === "string" ? wallet.email : null,
  };
}

export function createMobileLineOAuthHandoff(
  input: Omit<MobileLineOAuthHandoffPayload, "typ" | "flow" | "nonce" | "iat" | "exp">,
  options: { env?: Env } = {}
) {
  const payload: Omit<MobileLineOAuthHandoffPayload, "iat" | "exp"> = {
    typ: HANDOFF_TOKEN_TYPE,
    flow: MOBILE_LINE_FLOW,
    accountId: input.accountId,
    lineUserId: input.lineUserId,
    email: input.email,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    linkedWallet: input.linkedWallet,
    nonce: randomBytes(16).toString("hex"),
    ...(input.clientFlowId === undefined ? {} : { clientFlowId: normalizeMobileLineClientFlowId(input.clientFlowId) }),
  };

  return jwt.sign(payload, getSigningSecret(options.env), {
    algorithm: "HS256",
    audience: HANDOFF_AUDIENCE,
    expiresIn: "5m",
    issuer: TOKEN_ISSUER,
  });
}

export function verifyMobileLineOAuthHandoff(
  handoff: string,
  options: { env?: Env } = {}
): MobileLineOAuthHandoffPayload {
  const decoded = verifyAuthJwt(handoff, getSigningSecret(options.env), {
    algorithms: ["HS256"],
    audience: HANDOFF_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== HANDOFF_TOKEN_TYPE ||
    decoded.flow !== MOBILE_LINE_FLOW ||
    typeof decoded.accountId !== "string" ||
    !decoded.accountId.trim() ||
    typeof decoded.lineUserId !== "string" ||
    !decoded.lineUserId.trim() ||
    typeof decoded.nonce !== "string"
  ) {
    throw new InvalidAuthError("Invalid mobile LINE OAuth handoff");
  }

  return {
    typ: decoded.typ,
    flow: decoded.flow,
    accountId: decoded.accountId,
    lineUserId: decoded.lineUserId,
    email: typeof decoded.email === "string" ? decoded.email : null,
    displayName: typeof decoded.displayName === "string" ? decoded.displayName : null,
    avatarUrl: typeof decoded.avatarUrl === "string" ? decoded.avatarUrl : null,
    linkedWallet: mapLinkedWallet(decoded.linkedWallet),
    nonce: decoded.nonce,
    ...(decoded.clientFlowId === undefined ? {} : { clientFlowId: normalizeMobileLineClientFlowId(decoded.clientFlowId) }),
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export function appendLineHandoffToMobileReturnTo(returnTo: string, handoff: string, clientFlowId?: string) {
  const url = new URL(normalizeMobileLineReturnTo(returnTo));
  url.searchParams.set("provider", "line");
  url.searchParams.set("handoff", handoff);
  const flowId = normalizeMobileLineClientFlowId(clientFlowId);
  if (flowId) url.searchParams.set("clientFlowId", flowId);
  return url.toString();
}

export async function completeMobileLineCallback(input: {
  code: string;
  state: string;
  config?: LineWebAuthConfig;
  env?: Env;
  fetcher?: FetchLike;
  accountClient?: AccountServiceClient;
  requestId?: string;
}) {
  const requestId = safeAuthRequestId(input.requestId);
  const state = await runAuthStage(requestId, "mobile_line", "state_verify", () => verifyMobileLineOAuthState(input.state, { env: input.env }));
  const config = await runAuthStage(requestId, "mobile_line", "configuration", () => input.config ?? getLineMobileAuthConfig(input.env));
  const tokens = await runAuthStage(requestId, "mobile_line", "code_exchange", () => exchangeLineAuthorizationCode({
    code: input.code,
    config,
    fetcher: input.fetcher,
  }));
  const profile: LineVerifiedProfile = await runAuthStage(requestId, "mobile_line", "identity_verify", () => verifyLineIdToken({
    idToken: tokens.idToken,
    nonce: state.nonce,
    config,
    fetcher: input.fetcher,
  }));
  const account = await runAuthStage(requestId, "mobile_line", "account_upsert", () => findOrCreateLineAccount(
    {
      providerUserId: profile.providerUserId,
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    },
    input.accountClient
  ));
  const linkedWallet = await runAuthStage(requestId, "mobile_line", "wallet_lookup", () => getLinkedWallet(account.id, input.accountClient));
  const handoff = await runAuthStage(requestId, "mobile_line", "handoff_create", () => createMobileLineOAuthHandoff(
    {
      accountId: account.id,
      lineUserId: profile.providerUserId,
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      linkedWallet: mapLinkedWallet(linkedWallet),
      ...(state.clientFlowId ? { clientFlowId: state.clientFlowId } : {}),
    },
    { env: input.env }
  ));

  return {
    state,
    account,
    profile,
    handoff,
    deepLink: appendLineHandoffToMobileReturnTo(state.returnTo, handoff, state.clientFlowId),
  };
}
