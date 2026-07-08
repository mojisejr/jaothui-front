import type { NextApiRequest, NextApiResponse } from "next";
import { getMobileBuffalos } from "../../../../../server/mobile/public-journey";
import {
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<Awaited<ReturnType<typeof getMobileBuffalos>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  try {
    return sendMobileOk(req, res, await getMobileBuffalos(req.query));
  } catch (error) {
    console.error("Mobile buffalo list error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load buffalo list");
  }
}
