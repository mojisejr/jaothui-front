import type { NextApiRequest, NextApiResponse } from "next";
import { customerSession, eventFailure } from "../../../../../../server/mobile/events/http";
import { redeemLineLink } from "../../../../../../server/mobile/line-link";
import { sendMobileOk, requireMethod } from "../../../../../../server/mobile/response";
export default async function handler(req: NextApiRequest,res: NextApiResponse) {
  if (!requireMethod(req,res,"POST")) return;
  try { return sendMobileOk(req,res,await redeemLineLink(customerSession(req),req.body)); }
  catch (error) { return eventFailure(req,res,error); }
}
