import type { NextApiRequest, NextApiResponse } from "next";
import { getMobileCertSummary } from "../../../../../../server/mobile/public-journey";
import { PedigreeNotFoundError } from "../../../../../../server/services/metadata.service";
import {
  getRequestId,
  getSingleQueryValue,
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileCertSummary>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  const microchip = getSingleQueryValue(req.query.microchip);
  if (!microchip) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing microchip");
  }

  try {
    return sendMobileOk(req, res, await getMobileCertSummary(microchip));
  } catch (error) {
    if (error instanceof PedigreeNotFoundError) {
      return sendMobileError(req, res, 404, "NOT_FOUND", "Certificate not found");
    }

    console.error("Mobile cert summary unavailable", getRequestId(req));
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load certificate detail");
  }
}
