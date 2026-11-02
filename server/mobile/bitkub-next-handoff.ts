import { exchangeAuthorizationCode } from "@bitkub-blockchain/react-bitkubnext-oauth2";

import { getUserData } from "../../helpers/getUserData";
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
  | "create_handoff";

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

  return deepLink;
}
