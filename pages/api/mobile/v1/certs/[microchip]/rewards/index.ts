import type { NextApiRequest, NextApiResponse } from "next";
import { getMobileRewards } from "../../../../../../../server/mobile/public-journey";
import {
  getRequestId,
  getSingleQueryValue,
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileRewards>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  const microchip = getSingleQueryValue(req.query.microchip);
  if (!microchip) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing microchip");
  }

  try {
    return sendMobileOk(req, res, await getMobileRewards(microchip));
  } catch {
    console.error("Mobile rewards unavailable", getRequestId(req));
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load rewards");
  }
}
