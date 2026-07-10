import type { NextApiRequest, NextApiResponse } from "next";
import { getMobileNewsEvents } from "../../../../server/mobile/news-events";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileNewsEvents>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  try {
    return sendMobileOk(req, res, await getMobileNewsEvents());
  } catch (error) {
    console.error("Mobile news events error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load mobile news events");
  }
}
