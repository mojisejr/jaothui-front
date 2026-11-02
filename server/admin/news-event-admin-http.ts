import type { NextApiResponse } from "next";
import { ZodError } from "zod";

import { NewsAdminAuthError } from "./news-event-admin-auth";
import { NewsEventAdminValidationError } from "./news-event-admin.service";

export function sendNewsAdminJson(
  res: NextApiResponse,
  body: unknown,
  statusCode = 200
) {
  return res.status(statusCode).json(body);
}

export function sendNewsAdminError(res: NextApiResponse, error: unknown) {
  if (error instanceof NewsAdminAuthError) {
    return sendNewsAdminJson(res, { error: "UNAUTHORIZED" }, error.statusCode);
  }

  if (error instanceof NewsEventAdminValidationError) {
    return sendNewsAdminJson(
      res,
      { error: "VALIDATION_ERROR", message: error.message, fields: error.fields },
      error.statusCode
    );
  }

  if (error instanceof ZodError) {
    return sendNewsAdminJson(
      res,
      { error: "VALIDATION_ERROR", issues: error.issues },
      400
    );
  }

  console.error("[news-admin] Unexpected error", error);
  return sendNewsAdminJson(res, { error: "INTERNAL_ERROR" }, 500);
}
