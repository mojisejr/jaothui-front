import type { NextApiRequest, NextApiResponse } from "next";
import {
  getMobileCertificate,
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
  res: NextApiResponse<MobileResponse<NonNullable<Awaited<ReturnType<typeof getMobileCertificate>>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  const microchip = getSingleQueryValue(req.query.microchip);
  if (!microchip) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing microchip");
  }

  try {
    const certificate = await getMobileCertificate(microchip);
    if (!certificate) {
      return sendMobileError(
        req,
        res,
        404,
        "CERTIFICATE_UNAVAILABLE",
        "Certificate image is unavailable"
      );
    }

    return sendMobileOk(req, res, certificate);
  } catch (error) {
    if (isNotFoundError(error)) {
      return sendMobileError(req, res, 404, "NOT_FOUND", "Certificate not found");
    }

    console.error("Mobile certificate image error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to render certificate");
  }
}
