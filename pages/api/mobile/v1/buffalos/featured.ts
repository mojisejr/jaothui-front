import type { NextApiRequest, NextApiResponse } from "next";
import { getMobileFeaturedBuffalos } from "../../../../../server/mobile/public-journey";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileFeaturedBuffalos>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  try {
    return sendMobileOk(req, res, await getMobileFeaturedBuffalos());
  } catch (error) {
    console.error("Mobile featured buffalo error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load featured buffalo");
  }
}
