import type { NextApiRequest, NextApiResponse } from "next";
import { getMobileHome } from "../../../../server/mobile/public-journey";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileHome>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  try {
    return sendMobileOk(req, res, await getMobileHome());
  } catch (error) {
    console.error("Mobile home error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load mobile home");
  }
}
