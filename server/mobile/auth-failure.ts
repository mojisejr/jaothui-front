import type { NextApiRequest, NextApiResponse } from "next";
import { classifyAuthFailure, logAuthStage, type AuthFlow, type AuthStage } from "../auth/diagnostics";
import { getAuthRequestId } from "../auth/request-id";
import { sendMobileError } from "./response";

export function sendMobileAuthFailure(
  req: NextApiRequest,
  res: NextApiResponse,
  error: unknown,
  input: {
    flow: AuthFlow;
    stage: AuthStage;
    failureMessage: string;
    unauthorizedMessage?: string;
  }
) {
  const failure = classifyAuthFailure(error);
  logAuthStage({
    requestId: getAuthRequestId(req),
    flow: input.flow,
    stage: input.stage,
    outcome: "failed",
    error,
  });
  return sendMobileError(
    req,
    res,
    failure.status,
    failure.status === 401 ? "UNAUTHORIZED" : failure.status === 503 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR",
    failure.status === 401
      ? input.unauthorizedMessage ?? "Invalid or expired session"
      : failure.status === 503
        ? "Service temporarily unavailable. Please try again."
        : input.failureMessage
  );
}
