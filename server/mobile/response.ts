import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

export type MobileErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "NOT_FOUND"
  | "CERTIFICATE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type MobileOk<T> = {
  ok: true;
  data: T;
  requestId?: string;
};

export type MobileErr = {
  ok: false;
  error: {
    code: MobileErrorCode;
    message: string;
  };
  requestId?: string;
};

export type MobileResponse<T> = MobileOk<T> | MobileErr;

export function setMobileNoStoreHeaders(res: NextApiResponse) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader("Vary", "Authorization, X-Request-Id");
}

export function setMobileCorsHeaders(res: NextApiResponse) {
  setMobileNoStoreHeaders(res);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Accept, Authorization, Cache-Control, Content-Type, X-Request-Id"
  );
}

export function getRequestId(req: NextApiRequest): string | undefined {
  const raw = req.headers["x-request-id"];
  if (Array.isArray(raw)) return raw[0];
  return raw ?? randomUUID();
}

export function sendMobileOk<T>(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<T>>,
  data: T,
  status = 200
) {
  setMobileCorsHeaders(res);
  return res.status(status).json({
    ok: true,
    data,
    requestId: getRequestId(req),
  });
}

export function sendMobileError(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<never>>,
  status: number,
  code: MobileErrorCode,
  message: string
) {
  setMobileCorsHeaders(res);
  return res.status(status).json({
    ok: false,
    error: { code, message },
    requestId: getRequestId(req),
  });
}

export function requireMethod(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<never>>,
  method: string
) {
  setMobileCorsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }
  if (req.method === method) return true;
  res.setHeader("Allow", method);
  sendMobileError(req, res, 405, "METHOD_NOT_ALLOWED", `Use ${method}`);
  return false;
}

export function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parsePositiveInt(value: string | string[] | undefined, fallback: number) {
  const raw = getSingleQueryValue(value);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}
