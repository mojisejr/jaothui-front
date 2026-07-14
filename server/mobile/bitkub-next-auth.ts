import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { getOAuth2AuthorizeURL } from "@bitkub-blockchain/react-bitkubnext-oauth2";

const STATE_TOKEN_TYPE = "jaothui-mobile-oauth-state";
const HANDOFF_TOKEN_TYPE = "jaothui-mobile-oauth-handoff";
const LINK_STATE_TOKEN_TYPE = "jaothui-mobile-wallet-link-state";
const LINK_HANDOFF_TOKEN_TYPE = "jaothui-mobile-wallet-link-handoff";
const MOBILE_FLOW = "mobile";
const MOBILE_LINK_FLOW = "mobile-wallet-link";
const STATE_AUDIENCE = "jaothui-mobile-oauth";
const HANDOFF_AUDIENCE = "jaothui-mobile-handoff";
const TOKEN_ISSUER = "jaothui";

export type MobileOAuthStatePayload = {
  typ: typeof STATE_TOKEN_TYPE;
  flow: typeof MOBILE_FLOW;
  returnTo: string;
  nonce: string;
  iat?: number;
  exp?: number;
};

export type MobileOAuthHandoffPayload = {
  typ: typeof HANDOFF_TOKEN_TYPE;
  flow: typeof MOBILE_FLOW;
  walletAddress: string;
  email: string | null;
  nonce: string;
  iat?: number;
  exp?: number;
};

export type MobileWalletLinkStatePayload = {
  typ: typeof LINK_STATE_TOKEN_TYPE;
  flow: typeof MOBILE_LINK_FLOW;
  purpose: "link";
  returnTo: string;
  accountId: string;
  nonce: string;
  iat?: number;
  exp?: number;
};

export type MobileWalletLinkHandoffPayload = {
  typ: typeof LINK_HANDOFF_TOKEN_TYPE;
  flow: typeof MOBILE_LINK_FLOW;
  purpose: "link";
  accountId: string;
  linkedWallet: {
    walletAddress: string;
    provider: "bitkub-next";
    email: string | null;
  };
  nonce: string;
  iat?: number;
  exp?: number;
};

function getSigningSecret() {
  const secret =
    process.env.JAOTHUI_MOBILE_AUTH_SECRET || process.env.private_procedure_secret;

  if (!secret) {
    throw new Error("Missing JAOTHUI mobile auth signing secret");
  }

  return secret;
}

export function getBitkubNextClientId() {
  const clientId =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_client_id_prod
      : process.env.NEXT_PUBLIC_client_id_dev;

  if (!clientId) {
    throw new Error("Missing Bitkub NEXT client id");
  }

  return clientId;
}

export function getBitkubNextRedirectUrl() {
  const redirectUrl =
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_redirect_prod
      : process.env.NEXT_PUBLIC_redirect_dev;

  if (!redirectUrl) {
    throw new Error("Missing Bitkub NEXT redirect URL");
  }

  return redirectUrl;
}

export function normalizeMobileReturnTo(returnTo: string) {
  const parsed = new URL(returnTo);

  if (
    parsed.protocol !== "jaothui:" ||
    parsed.hostname !== "oauth" ||
    parsed.pathname !== "/callback" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("Unsupported mobile OAuth return target");
  }

  return "jaothui://oauth/callback";
}

export function createMobileOAuthState(returnTo: string) {
  const payload: Omit<MobileOAuthStatePayload, "iat" | "exp"> = {
    typ: STATE_TOKEN_TYPE,
    flow: MOBILE_FLOW,
    returnTo: normalizeMobileReturnTo(returnTo),
    nonce: randomBytes(16).toString("hex"),
  };

  return jwt.sign(payload, getSigningSecret(), {
    algorithm: "HS256",
    audience: STATE_AUDIENCE,
    expiresIn: "10m",
    issuer: TOKEN_ISSUER,
  });
}

export function createMobileWalletLinkState(input: {
  returnTo: string;
  accountId: string;
}) {
  const accountId = input.accountId.trim();
  if (!accountId) {
    throw new Error("accountId is required");
  }

  const payload: Omit<MobileWalletLinkStatePayload, "iat" | "exp"> = {
    typ: LINK_STATE_TOKEN_TYPE,
    flow: MOBILE_LINK_FLOW,
    purpose: "link",
    returnTo: normalizeMobileReturnTo(input.returnTo),
    accountId,
    nonce: randomBytes(16).toString("hex"),
  };

  return jwt.sign(payload, getSigningSecret(), {
    algorithm: "HS256",
    audience: STATE_AUDIENCE,
    expiresIn: "10m",
    issuer: TOKEN_ISSUER,
  });
}

export function verifyMobileOAuthState(state: string): MobileOAuthStatePayload {
  const decoded = jwt.verify(state, getSigningSecret(), {
    algorithms: ["HS256"],
    audience: STATE_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== STATE_TOKEN_TYPE ||
    decoded.flow !== MOBILE_FLOW ||
    typeof decoded.returnTo !== "string" ||
    typeof decoded.nonce !== "string"
  ) {
    throw new Error("Invalid mobile OAuth state");
  }

  return {
    typ: decoded.typ,
    flow: decoded.flow,
    returnTo: normalizeMobileReturnTo(decoded.returnTo),
    nonce: decoded.nonce,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export function verifyMobileWalletLinkState(
  state: string
): MobileWalletLinkStatePayload {
  const decoded = jwt.verify(state, getSigningSecret(), {
    algorithms: ["HS256"],
    audience: STATE_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== LINK_STATE_TOKEN_TYPE ||
    decoded.flow !== MOBILE_LINK_FLOW ||
    decoded.purpose !== "link" ||
    typeof decoded.returnTo !== "string" ||
    typeof decoded.accountId !== "string" ||
    typeof decoded.nonce !== "string"
  ) {
    throw new Error("Invalid mobile wallet link state");
  }

  return {
    typ: decoded.typ,
    flow: decoded.flow,
    purpose: "link",
    returnTo: normalizeMobileReturnTo(decoded.returnTo),
    accountId: decoded.accountId,
    nonce: decoded.nonce,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export function createMobileOAuthHandoff(input: {
  walletAddress: string;
  email?: string | null;
}) {
  const payload: Omit<MobileOAuthHandoffPayload, "iat" | "exp"> = {
    typ: HANDOFF_TOKEN_TYPE,
    flow: MOBILE_FLOW,
    walletAddress: input.walletAddress,
    email: input.email ?? null,
    nonce: randomBytes(16).toString("hex"),
  };

  return jwt.sign(payload, getSigningSecret(), {
    algorithm: "HS256",
    audience: HANDOFF_AUDIENCE,
    expiresIn: "5m",
    issuer: TOKEN_ISSUER,
  });
}

export function createMobileWalletLinkHandoff(input: {
  accountId: string;
  walletAddress: string;
  email?: string | null;
}) {
  const accountId = input.accountId.trim();
  const walletAddress = input.walletAddress.trim();
  if (!accountId) {
    throw new Error("accountId is required");
  }
  if (!walletAddress) {
    throw new Error("walletAddress is required");
  }

  const payload: Omit<MobileWalletLinkHandoffPayload, "iat" | "exp"> = {
    typ: LINK_HANDOFF_TOKEN_TYPE,
    flow: MOBILE_LINK_FLOW,
    purpose: "link",
    accountId,
    linkedWallet: {
      walletAddress,
      provider: "bitkub-next",
      email: input.email ?? null,
    },
    nonce: randomBytes(16).toString("hex"),
  };

  return jwt.sign(payload, getSigningSecret(), {
    algorithm: "HS256",
    audience: HANDOFF_AUDIENCE,
    expiresIn: "5m",
    issuer: TOKEN_ISSUER,
  });
}

export function verifyMobileOAuthHandoff(
  handoff: string
): MobileOAuthHandoffPayload {
  const decoded = jwt.verify(handoff, getSigningSecret(), {
    algorithms: ["HS256"],
    audience: HANDOFF_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== HANDOFF_TOKEN_TYPE ||
    decoded.flow !== MOBILE_FLOW ||
    typeof decoded.walletAddress !== "string" ||
    typeof decoded.nonce !== "string"
  ) {
    throw new Error("Invalid mobile OAuth handoff");
  }

  return {
    typ: decoded.typ,
    flow: decoded.flow,
    walletAddress: decoded.walletAddress,
    email: typeof decoded.email === "string" ? decoded.email : null,
    nonce: decoded.nonce,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export function verifyMobileWalletLinkHandoff(
  handoff: string
): MobileWalletLinkHandoffPayload {
  const decoded = jwt.verify(handoff, getSigningSecret(), {
    algorithms: ["HS256"],
    audience: HANDOFF_AUDIENCE,
    issuer: TOKEN_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded.typ !== LINK_HANDOFF_TOKEN_TYPE ||
    decoded.flow !== MOBILE_LINK_FLOW ||
    decoded.purpose !== "link" ||
    typeof decoded.accountId !== "string" ||
    typeof decoded.linkedWallet !== "object" ||
    decoded.linkedWallet === null ||
    typeof decoded.nonce !== "string"
  ) {
    throw new Error("Invalid mobile wallet link handoff");
  }

  const linkedWallet = decoded.linkedWallet as Record<string, unknown>;
  if (
    linkedWallet.provider !== "bitkub-next" ||
    typeof linkedWallet.walletAddress !== "string" ||
    !linkedWallet.walletAddress.trim()
  ) {
    throw new Error("Invalid mobile wallet link handoff");
  }

  return {
    typ: decoded.typ,
    flow: decoded.flow,
    purpose: "link",
    accountId: decoded.accountId,
    linkedWallet: {
      walletAddress: linkedWallet.walletAddress,
      provider: "bitkub-next",
      email: typeof linkedWallet.email === "string" ? linkedWallet.email : null,
    },
    nonce: decoded.nonce,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export function buildBitkubNextAuthorizeUrl(state: string) {
  return getOAuth2AuthorizeURL(
    getBitkubNextClientId(),
    getBitkubNextRedirectUrl(),
    state
  );
}

export function appendHandoffToMobileReturnTo(returnTo: string, handoff: string) {
  const url = new URL(normalizeMobileReturnTo(returnTo));
  url.searchParams.set("handoff", handoff);
  return url.toString();
}

export function appendWalletLinkHandoffToMobileReturnTo(
  returnTo: string,
  handoff: string
) {
  const url = new URL(normalizeMobileReturnTo(returnTo));
  url.searchParams.set("provider", "bitkub-next");
  url.searchParams.set("purpose", "link");
  url.searchParams.set("handoff", handoff);
  return url.toString();
}
