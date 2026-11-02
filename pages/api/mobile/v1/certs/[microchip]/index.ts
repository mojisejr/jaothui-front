import type { NextApiRequest, NextApiResponse } from "next";
import {
  getMobileCertDetail,
  isNotFoundError,
} from "../../../../../../server/mobile/public-journey";
import {
  getSingleQueryValue,
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileCertDetail>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  const microchip = getSingleQueryValue(req.query.microchip);
  if (!microchip) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing microchip");
  }

  try {
    return sendMobileOk(req, res, await getMobileCertDetail(microchip));
  } catch (error) {
    if (isNotFoundError(error)) {
      return sendMobileError(req, res, 404, "NOT_FOUND", "Certificate not found");
    }

    console.error("Mobile cert detail error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load certificate detail");
  }
}
