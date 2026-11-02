import { timingSafeEqual } from "crypto";
import type { NextApiRequest } from "next";

export const NEWS_ADMIN_API_KEY_ENV = "JAOTHUI_NEWS_ADMIN_API_KEY";
export const NEWS_ADMIN_SERVER_ONLY_SANITY_TOKEN_ENV = "SANITY_WRITE_TOKEN";

export class NewsAdminAuthError extends Error {
  readonly statusCode = 401;

  constructor(message = "Unauthorized news admin request") {
    super(message);
    this.name = "NewsAdminAuthError";
  }
}

export interface NewsAdminEnvStatus {
  adminApiKeyConfigured: boolean;
  serverOnlySanityTokenConfigured: boolean;
  missing: string[];
}

type HeaderValue = string | string[] | undefined;
type HeaderBag = {
  authorization?: HeaderValue;
};

export function getNewsAdminEnvStatus(
  env: NodeJS.ProcessEnv = process.env
): NewsAdminEnvStatus {
  const adminApiKeyConfigured = Boolean(env[NEWS_ADMIN_API_KEY_ENV]);
  const serverOnlySanityTokenConfigured = Boolean(
    env[NEWS_ADMIN_SERVER_ONLY_SANITY_TOKEN_ENV]
  );
  const missing = [
    adminApiKeyConfigured ? null : NEWS_ADMIN_API_KEY_ENV,
  ].filter(Boolean) as string[];

  return {
    adminApiKeyConfigured,
    serverOnlySanityTokenConfigured,
    missing,
  };
}

export function readBearerToken(headers: HeaderBag): string | null {
  const authorization = Array.isArray(headers.authorization)
    ? headers.authorization[0]
    : headers.authorization;

  if (!authorization) return null;

  const [scheme, token] = authorization.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

function constantTimeEquals(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isAuthorizedNewsAdminRequest(
  req: Pick<NextApiRequest, "headers">,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const expectedKey = env[NEWS_ADMIN_API_KEY_ENV];
  const bearerToken = readBearerToken(req.headers);

  if (!expectedKey || !bearerToken) {
    return false;
  }

  return constantTimeEquals(bearerToken, expectedKey);
}

export function requireNewsAdminRequest(
  req: Pick<NextApiRequest, "headers">,
  env: NodeJS.ProcessEnv = process.env
): void {
  if (!isAuthorizedNewsAdminRequest(req, env)) {
    throw new NewsAdminAuthError();
  }
}
