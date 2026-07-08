import type { NextApiRequest, NextApiResponse } from "next";
import { getMobileRewardDetail } from "../../../../../../../server/mobile/public-journey";
import {
  getSingleQueryValue,
  MobileResponse,
  requireMethod,
  sendMobileError,
  sendMobileOk,
} from "../../../../../../../server/mobile/response";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MobileResponse<NonNullable<Awaited<ReturnType<typeof getMobileRewardDetail>>>>>
) {
  if (!requireMethod(req, res, "GET")) return;

  const microchip = getSingleQueryValue(req.query.microchip);
  const rewardId = getSingleQueryValue(req.query.rewardId);

  if (!microchip || !rewardId) {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Missing microchip or rewardId");
  }

  try {
    const reward = await getMobileRewardDetail(microchip, rewardId);
    if (!reward) {
      return sendMobileError(req, res, 404, "NOT_FOUND", "Reward not found");
    }

    return sendMobileOk(req, res, reward);
  } catch (error) {
    console.error("Mobile reward detail error:", error);
    return sendMobileError(req, res, 500, "INTERNAL_ERROR", "Unable to load reward detail");
  }
}
