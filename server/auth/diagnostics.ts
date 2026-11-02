import { AccountNotActiveError, ReviewerSandboxAccountError } from "../services/account.service";
import { AuthConfigurationError, AuthServiceUnavailableError, InvalidAuthError } from "./errors";
import { safeAuthRequestId } from "./request-id";

export type AuthFailureCategory = "invalid_auth" | "database_unavailable" | "service_unavailable" | "configuration" | "unexpected";
const TRANSIENT_DB_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024", "EMAXCONNSESSION", "53300", "57P03"]);

export function classifyAuthFailure(error: unknown): { category: AuthFailureCategory; status: 401 | 503 | 500 } {
  if (error instanceof InvalidAuthError || error instanceof AccountNotActiveError || error instanceof ReviewerSandboxAccountError) {
    return { category: "invalid_auth", status: 401 };
  }
  if (error instanceof AuthConfigurationError) return { category: "configuration", status: 500 };
  if (error instanceof AuthServiceUnavailableError) return { category: "service_unavailable", status: 503 };
  // Only explicit database codes/signatures identify a temporary DB failure.
  // In particular, words such as "session", "token" and "account" say nothing
  // about whether a user's authentication is valid.
  const seen = new Set<unknown>();
  let cause = error;
  for (let depth = 0; depth < 4 && cause && typeof cause === "object" && !seen.has(cause); depth += 1) {
    seen.add(cause);
    const value = cause as { code?: unknown; errorCode?: unknown; message?: unknown; cause?: unknown };
    // Prisma known-request errors use `code`; initialization errors expose
    // `errorCode`. Neither form implies the user's JWT has become invalid.
    if ([value.code, value.errorCode].some((code) => typeof code === "string" && TRANSIENT_DB_CODES.has(code))) {
      return { category: "database_unavailable", status: 503 };
    }
    if (typeof value.message === "string" && (/\bEMAXCONNSESSION\b/.test(value.message) || /max clients reached in session mode[\s\S]*pool_size/i.test(value.message))) {
      return { category: "database_unavailable", status: 503 };
    }
    cause = value.cause;
  }
  return { category: "unexpected", status: 500 };
}

export type AuthFlow = "mobile_line" | "mobile_apple" | "mobile_account" | "mobile_wallet" | "mobile_reviewer" | "mobile_legacy" | "web_line";
export type AuthStage = "state_verify" | "configuration" | "code_exchange" | "identity_verify" | "account_upsert" | "wallet_lookup" | "handoff_create" | "session_redeem" | "profile_read" | "account_delete" | "wallet_link" | "reviewer_session" | "callback";
const FLOWS = new Set<AuthFlow>(["mobile_line", "mobile_apple", "mobile_account", "mobile_wallet", "mobile_reviewer", "mobile_legacy", "web_line"]);
const STAGES = new Set<AuthStage>(["state_verify", "configuration", "code_exchange", "identity_verify", "account_upsert", "wallet_lookup", "handoff_create", "session_redeem", "profile_read", "account_delete", "wallet_link", "reviewer_session", "callback"]);

export function logAuthStage(input: {
  requestId: string;
  flow: AuthFlow;
  stage: AuthStage;
  outcome: "started" | "completed" | "failed";
  startedAt?: number;
  error?: unknown;
}) {
  // Build an allowlisted object; never spread errors, request objects, URLs,
  // tokens, authorization codes, provider subjects or personal profile data.
  const entry = {
    requestId: safeAuthRequestId(input.requestId),
    flow: FLOWS.has(input.flow) ? input.flow : "mobile_account",
    stage: STAGES.has(input.stage) ? input.stage : "callback",
    outcome: input.outcome === "started" || input.outcome === "completed" ? input.outcome : "failed",
    ...(input.startedAt === undefined ? {} : { durationMs: Math.max(0, Date.now() - input.startedAt) }),
    ...(input.outcome === "failed" ? { category: classifyAuthFailure(input.error).category } : {}),
  };
  if (input.outcome === "failed") console.warn("JAOTHUI auth stage", entry);
  else console.info("JAOTHUI auth stage", entry);
}

export async function runAuthStage<T>(requestId: string, flow: AuthFlow, stage: AuthStage, operation: () => Promise<T> | T): Promise<T> {
  const startedAt = Date.now();
  logAuthStage({ requestId, flow, stage, outcome: "started" });
  try {
    const result = await operation();
    logAuthStage({ requestId, flow, stage, outcome: "completed", startedAt });
    return result;
  } catch (error) {
    logAuthStage({ requestId, flow, stage, outcome: "failed", startedAt, error });
    throw error;
  }
}
