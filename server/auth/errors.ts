import jwt from "jsonwebtoken";

/** Construct only at a token/claim verification boundary, never from message guessing. */
export class InvalidAuthError extends Error {
  constructor(message = "Invalid or expired session") {
    super(message);
    this.name = "InvalidAuthError";
  }
}

export class AuthConfigurationError extends Error {
  constructor(message = "Authentication configuration is unavailable") {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

export class AuthServiceUnavailableError extends Error {
  constructor(message = "Authentication service is temporarily unavailable") {
    super(message);
    this.name = "AuthServiceUnavailableError";
  }
}

export function verifyAuthJwt(
  token: string,
  secret: jwt.Secret,
  options: jwt.VerifyOptions
): string | jwt.JwtPayload {
  try {
    return jwt.verify(token, secret, { ...options, complete: false });
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      throw new InvalidAuthError("Invalid mobile session token");
    }
    throw error;
  }
}
