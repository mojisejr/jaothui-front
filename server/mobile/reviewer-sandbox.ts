import { createHash, timingSafeEqual } from "crypto";

export const REVIEWER_SANDBOX_PROVIDER_USER_ID = "jaothui-mobile-reviewer-v1";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type ReviewerSandboxConfig = {
  enabled: boolean;
  username: string | null;
  password: string | null;
};

type RateLimitEntry = { attempts: number; resetAt: number };
const attemptsByKey = new Map<string, RateLimitEntry>();

export function getReviewerSandboxConfig(
  env: NodeJS.ProcessEnv = process.env
): ReviewerSandboxConfig {
  const username = env.JAOTHUI_REVIEWER_SANDBOX_USERNAME?.trim() || null;
  const password = env.JAOTHUI_REVIEWER_SANDBOX_PASSWORD || null;
  return {
    enabled: env.JAOTHUI_REVIEWER_SANDBOX_ENABLED === "true",
    username,
    password,
  };
}

function fixedTimeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function reviewerSandboxCredentialsAreValid(
  input: { username?: unknown; password?: unknown },
  config: ReviewerSandboxConfig = getReviewerSandboxConfig()
) {
  if (!config.enabled || !config.username || !config.password) return false;
  if (typeof input.username !== "string" || typeof input.password !== "string") {
    return false;
  }
  return (
    fixedTimeEqual(input.username.trim(), config.username) &&
    fixedTimeEqual(input.password, config.password)
  );
}

export function reviewerSandboxAllowsAttempt(
  key: string,
  now = Date.now()
) {
  const normalizedKey = key || "unknown";
  const existing = attemptsByKey.get(normalizedKey);
  return !existing || existing.resetAt <= now || existing.attempts < MAX_ATTEMPTS;
}

/** Record only rejected credential attempts. Successful reviewer sign-ins stay reusable. */
export function registerReviewerSandboxCredentialFailure(
  key: string,
  now = Date.now()
) {
  const normalizedKey = key || "unknown";
  const existing = attemptsByKey.get(normalizedKey);
  if (!existing || existing.resetAt <= now) {
    attemptsByKey.set(normalizedKey, { attempts: 1, resetAt: now + WINDOW_MS });
    return;
  }
  existing.attempts += 1;
}

export function clearReviewerSandboxRateLimitForTests() {
  attemptsByKey.clear();
}

export type ReviewerWalletFixture = {
  kind: "reviewer-sandbox";
  label: "Demo wallet fixture";
  linked: boolean;
  walletAddress: null;
};

export function createReviewerWalletFixture(linked: boolean): ReviewerWalletFixture {
  return {
    kind: "reviewer-sandbox",
    label: "Demo wallet fixture",
    linked,
    walletAddress: null,
  };
}
