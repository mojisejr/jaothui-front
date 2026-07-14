import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const LINE_AUTHORIZE_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_ID_TOKEN_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

const WEB_LINE_STATE_TYPE = "jaothui-web-line-oauth-state";
const WEB_LINE_FLOW = "web-v2";
const STATE_SIGNATURE_HEX_LENGTH = 64;
const STATE_TTL_SECONDS = 60 * 10;
const DEFAULT_LINE_SCOPE = "openid profile";
const DEFAULT_RETURN_TO = "/v2/profile";

type Env = Record<string, string | undefined>;
type FetchLike = typeof fetch;

export type LineWebAuthConfig = {
  channelId: string;
  channelSecret: string;
  callbackUrl: string;
  scope: string;
};

export type WebLineOAuthStatePayload = {
  typ: typeof WEB_LINE_STATE_TYPE;
  flow: typeof WEB_LINE_FLOW;
  returnTo: string;
  nonce: string;
  iat: number;
  exp: number;
};

export type WebLineOAuthState = {
  state: string;
  payload: WebLineOAuthStatePayload;
};

export type LineTokenResponse = {
  accessToken: string;
  idToken: string;
  expiresIn: number | null;
  scope: string | null;
  tokenType: string | null;
};

export type LineVerifiedProfile = {
  providerUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
};

export type LineWebCallbackContractResult = {
  state: WebLineOAuthStatePayload;
  profile: LineVerifiedProfile;
};

function getSigningSecret(env: Env = process.env) {
  const secret = env.JAOTHUI_MOBILE_AUTH_SECRET || env.private_procedure_secret;

  if (!secret) {
    throw new Error("Missing JAOTHUI auth signing secret");
  }

  return secret;
}

function getRequiredEnv(name: keyof Env, env: Env) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
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
    throw new Error("LINE login scope must include openid and profile");
  }

  return normalized;
}

export function getLineWebAuthConfig(env: Env = process.env): LineWebAuthConfig {
  return {
    channelId: getRequiredEnv("JAOTHUI_LINE_LOGIN_CHANNEL_ID", env),
    channelSecret: getRequiredEnv("JAOTHUI_LINE_LOGIN_CHANNEL_SECRET", env),
    callbackUrl: getRequiredEnv("JAOTHUI_LINE_LOGIN_CALLBACK_URL", env),
    scope: normalizeLineScope(env.JAOTHUI_LINE_LOGIN_SCOPE),
  };
}

export function normalizeWebLineReturnTo(returnTo: string | undefined) {
  const candidate = returnTo?.trim() || DEFAULT_RETURN_TO;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    throw new Error("Unsupported LINE login return target");
  }

  const parsed = new URL(candidate, "https://www.jaothui.com");
  if (parsed.origin !== "https://www.jaothui.com" || parsed.hash) {
    throw new Error("Unsupported LINE login return target");
  }

  if (!parsed.pathname.startsWith("/v2")) {
    throw new Error("Unsupported LINE login return target");
  }

  return `${parsed.pathname}${parsed.search}`;
}

function signPayloadHex(payloadHex: string, secret: string) {
  return createHmac("sha256", secret).update(payloadHex).digest("hex");
}

function encodeStatePayload(payload: WebLineOAuthStatePayload, secret: string) {
  const payloadHex = Buffer.from(JSON.stringify(payload), "utf8").toString("hex");
  return `${payloadHex}${signPayloadHex(payloadHex, secret)}`;
}

function decodeStatePayload(
  state: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): WebLineOAuthStatePayload {
  if (
    state.length <= STATE_SIGNATURE_HEX_LENGTH ||
    !/^[a-f0-9]+$/i.test(state)
  ) {
    throw new Error("Invalid LINE OAuth state");
  }

  const payloadHex = state.slice(0, -STATE_SIGNATURE_HEX_LENGTH);
  const signatureHex = state.slice(-STATE_SIGNATURE_HEX_LENGTH);
  const expectedSignatureHex = signPayloadHex(payloadHex, secret);
  const signature = Buffer.from(signatureHex, "hex");
  const expectedSignature = Buffer.from(expectedSignatureHex, "hex");

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(signature, expectedSignature)
  ) {
    throw new Error("Invalid LINE OAuth state");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(payloadHex, "hex").toString("utf8"));
  } catch {
    throw new Error("Invalid LINE OAuth state");
  }

  if (
    !decoded ||
    typeof decoded !== "object" ||
    (decoded as Record<string, unknown>).typ !== WEB_LINE_STATE_TYPE ||
    (decoded as Record<string, unknown>).flow !== WEB_LINE_FLOW ||
    typeof (decoded as Record<string, unknown>).returnTo !== "string" ||
    typeof (decoded as Record<string, unknown>).nonce !== "string" ||
    typeof (decoded as Record<string, unknown>).iat !== "number" ||
    typeof (decoded as Record<string, unknown>).exp !== "number"
  ) {
    throw new Error("Invalid LINE OAuth state");
  }

  const payload = decoded as WebLineOAuthStatePayload;
  if (payload.exp < nowSeconds) {
    throw new Error("Expired LINE OAuth state");
  }

  return {
    ...payload,
    returnTo: normalizeWebLineReturnTo(payload.returnTo),
  };
}

export function createWebLineOAuthState(
  returnTo?: string,
  options: { env?: Env; nowSeconds?: number } = {}
): WebLineOAuthState {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload: WebLineOAuthStatePayload = {
    typ: WEB_LINE_STATE_TYPE,
    flow: WEB_LINE_FLOW,
    returnTo: normalizeWebLineReturnTo(returnTo),
    nonce: randomBytes(16).toString("hex"),
    iat: nowSeconds,
    exp: nowSeconds + STATE_TTL_SECONDS,
  };

  return {
    state: encodeStatePayload(payload, getSigningSecret(options.env)),
    payload,
  };
}

export function verifyWebLineOAuthState(
  state: string,
  options: { env?: Env; nowSeconds?: number } = {}
) {
  return decodeStatePayload(
    state,
    getSigningSecret(options.env),
    options.nowSeconds
  );
}

export function buildLineWebAuthorizeUrl(input: {
  state: string;
  nonce: string;
  config?: LineWebAuthConfig;
}) {
  const config = input.config ?? getLineWebAuthConfig();
  const url = new URL(LINE_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.channelId);
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("state", input.state);
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("nonce", input.nonce);
  return url.toString();
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function exchangeLineAuthorizationCode(input: {
  code: string;
  config?: LineWebAuthConfig;
  fetcher?: FetchLike;
}) {
  const code = input.code.trim();
  if (!code) {
    throw new Error("Missing LINE authorization code");
  }

  const config = input.config ?? getLineWebAuthConfig();
  const fetcher = input.fetcher ?? fetch;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.callbackUrl,
    client_id: config.channelId,
    client_secret: config.channelSecret,
  });

  const response = await fetcher(LINE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(`LINE token exchange failed (${response.status})`);
  }

  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as Record<string, unknown>).access_token !== "string" ||
    typeof (json as Record<string, unknown>).id_token !== "string"
  ) {
    throw new Error("LINE token exchange returned an invalid payload");
  }

  return {
    accessToken: (json as Record<string, string>).access_token,
    idToken: (json as Record<string, string>).id_token,
    expiresIn:
      typeof (json as Record<string, unknown>).expires_in === "number"
        ? ((json as Record<string, unknown>).expires_in as number)
        : null,
    scope:
      typeof (json as Record<string, unknown>).scope === "string"
        ? ((json as Record<string, unknown>).scope as string)
        : null,
    tokenType:
      typeof (json as Record<string, unknown>).token_type === "string"
        ? ((json as Record<string, unknown>).token_type as string)
        : null,
  } satisfies LineTokenResponse;
}

export async function verifyLineIdToken(input: {
  idToken: string;
  nonce: string;
  config?: LineWebAuthConfig;
  fetcher?: FetchLike;
}) {
  const idToken = input.idToken.trim();
  if (!idToken) {
    throw new Error("Missing LINE ID token");
  }

  const config = input.config ?? getLineWebAuthConfig();
  const fetcher = input.fetcher ?? fetch;
  const body = new URLSearchParams({
    id_token: idToken,
    client_id: config.channelId,
    nonce: input.nonce,
  });

  const response = await fetcher(LINE_ID_TOKEN_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(`LINE ID token verification failed (${response.status})`);
  }

  if (
    !json ||
    typeof json !== "object" ||
    typeof (json as Record<string, unknown>).sub !== "string"
  ) {
    throw new Error("LINE ID token verification returned an invalid payload");
  }

  const record = json as Record<string, unknown>;
  if (typeof record.nonce === "string" && record.nonce !== input.nonce) {
    throw new Error("LINE ID token nonce mismatch");
  }

  return {
    providerUserId: record.sub as string,
    displayName: typeof record.name === "string" ? record.name : null,
    avatarUrl: typeof record.picture === "string" ? record.picture : null,
    email: typeof record.email === "string" ? record.email : null,
  } satisfies LineVerifiedProfile;
}

export async function completeLineWebCallbackContract(input: {
  code: string;
  state: string;
  config?: LineWebAuthConfig;
  env?: Env;
  fetcher?: FetchLike;
}) {
  const state = verifyWebLineOAuthState(input.state, { env: input.env });
  const config = input.config ?? getLineWebAuthConfig(input.env);
  const tokens = await exchangeLineAuthorizationCode({
    code: input.code,
    config,
    fetcher: input.fetcher,
  });
  const profile = await verifyLineIdToken({
    idToken: tokens.idToken,
    nonce: state.nonce,
    config,
    fetcher: input.fetcher,
  });

  return {
    state,
    profile,
  } satisfies LineWebCallbackContractResult;
}

export function classifyLineWebAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return "unknown_error";
  }

  const message = error.message.toLowerCase();
  if (message.includes("missing jaothui_line")) return "missing_line_env";
  if (message.includes("state")) return "invalid_state";
  if (message.includes("authorization code")) return "missing_authorization_code";
  if (message.includes("token exchange")) return "line_token_exchange_failed";
  if (message.includes("id token")) return "line_id_token_verify_failed";
  if (message.includes("timeout") || message.includes("timed out")) {
    return "external_request_timeout";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "external_request_failed";
  }

  return "unexpected_error";
}
