import { exchangeAuthorizationCode } from "@bitkub-blockchain/react-bitkubnext-oauth2";

import { getUserData } from "../../helpers/getUserData";
import { hasUser, registerUser } from "../services/user.service";
import {
  appendHandoffToMobileReturnTo,
  createMobileOAuthHandoff,
  getBitkubNextClientId,
  getBitkubNextRedirectUrl,
  verifyMobileOAuthState,
} from "./bitkub-next-auth";

type MobileHandoffStage =
  | "state_verify"
  | "exchange_authorization_code"
  | "get_user_data"
  | "register_user_best_effort"
  | "create_handoff";

const USER_REGISTRATION_BEST_EFFORT_TIMEOUT_MS = 2500;

function getDurationMs(startedAt: number) {
  return Date.now() - startedAt;
}

function classifyMobileHandoffError(error: unknown) {
  if (!(error instanceof Error)) {
    return "unknown_error";
  }

  const message = error.message.toLowerCase();

  if (message.includes("authorization code")) {
    return "authorization_code_exchange_failed";
  }

  if (message.includes("validate bitkub next user")) {
    return "bitkub_next_user_validation_failed";
  }

  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("econnaborted") ||
    message.includes("etimedout")
  ) {
    return "external_request_timeout";
  }

  if (
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("enotfound") ||
    message.includes("econnrefused")
  ) {
    return "external_request_failed";
  }

  return "unexpected_error";
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function logMobileHandoffStageStart(stage: MobileHandoffStage) {
  console.info("Mobile Bitkub NEXT handoff stage started", { stage });
}

function logMobileHandoffStageComplete(
  stage: MobileHandoffStage,
  startedAt: number,
  details?: Record<string, boolean | number | string>
) {
  console.info("Mobile Bitkub NEXT handoff stage completed", {
    stage,
    durationMs: getDurationMs(startedAt),
    ...details,
  });
}

function logMobileHandoffStageFailed(
  stage: MobileHandoffStage,
  startedAt: number,
  error: unknown
) {
  console.warn("Mobile Bitkub NEXT handoff stage failed", {
    stage,
    durationMs: getDurationMs(startedAt),
    errorClass: classifyMobileHandoffError(error),
  });
}

async function registerUserBestEffort(wallet: string, email: string | null) {
  const startedAt = Date.now();
  logMobileHandoffStageStart("register_user_best_effort");

  try {
    const foundUser = await withTimeout(
      (async () => {
        const existingUser = await hasUser(wallet);
        if (!existingUser) {
          await registerUser({ wallet, email, name: null, tel: null });
        }

        return existingUser;
      })(),
      USER_REGISTRATION_BEST_EFFORT_TIMEOUT_MS,
      "Mobile Bitkub NEXT best-effort registration timed out"
    );

    logMobileHandoffStageComplete("register_user_best_effort", startedAt, {
      foundUser,
      hasEmail: Boolean(email),
      timeoutMs: USER_REGISTRATION_BEST_EFFORT_TIMEOUT_MS,
    });
  } catch (error) {
    logMobileHandoffStageFailed("register_user_best_effort", startedAt, error);
  }
}

function scheduleUserRegistrationBestEffort(wallet: string, email: string | null) {
  setTimeout(() => {
    void registerUserBestEffort(wallet, email);
  }, 0);
}

export async function createMobileBitkubNextDeepLink(input: {
  code: string;
  state: string;
}) {
  let startedAt = Date.now();
  logMobileHandoffStageStart("state_verify");
  const verifiedState = verifyMobileOAuthState(input.state);
  logMobileHandoffStageComplete("state_verify", startedAt);

  startedAt = Date.now();
  logMobileHandoffStageStart("exchange_authorization_code");
  let tokens: Awaited<ReturnType<typeof exchangeAuthorizationCode>>;
  try {
    tokens = await exchangeAuthorizationCode(
      getBitkubNextClientId(),
      getBitkubNextRedirectUrl(),
      input.code
    );
    logMobileHandoffStageComplete("exchange_authorization_code", startedAt, {
      hasAccessToken: Boolean(tokens?.access_token),
    });
  } catch (error) {
    logMobileHandoffStageFailed("exchange_authorization_code", startedAt, error);
    throw error;
  }

  if (!tokens?.access_token) {
    const error = new Error("Unable to exchange authorization code");
    logMobileHandoffStageFailed("exchange_authorization_code", startedAt, error);
    throw error;
  }

  startedAt = Date.now();
  logMobileHandoffStageStart("get_user_data");
  let userData: Awaited<ReturnType<typeof getUserData>>;
  try {
    userData = await getUserData(tokens.access_token);
    logMobileHandoffStageComplete("get_user_data", startedAt, {
      success: Boolean(userData.success),
      hasWalletAddress: Boolean(userData.wallet_address),
      hasEmail: Boolean(userData.email),
    });
  } catch (error) {
    logMobileHandoffStageFailed("get_user_data", startedAt, error);
    throw error;
  }

  if (!userData.success || !userData.wallet_address) {
    const error = new Error("Unable to validate Bitkub NEXT user");
    logMobileHandoffStageFailed("get_user_data", startedAt, error);
    throw error;
  }

  startedAt = Date.now();
  logMobileHandoffStageStart("create_handoff");
  const handoff = createMobileOAuthHandoff({
    walletAddress: userData.wallet_address,
    email: userData.email ?? null,
  });

  const deepLink = appendHandoffToMobileReturnTo(verifiedState.returnTo, handoff);
  logMobileHandoffStageComplete("create_handoff", startedAt);

  scheduleUserRegistrationBestEffort(
    userData.wallet_address,
    userData.email ?? null
  );

  return deepLink;
}
