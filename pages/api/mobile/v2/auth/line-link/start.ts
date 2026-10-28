import type { NextApiRequest, NextApiResponse } from "next";
import { customerSession, eventFailure } from "../../../../../../server/mobile/events/http";
import { startLineLink, cancelLineLink } from "../../../../../../server/mobile/line-link";
import { sendMobileOk, sendMobileError, setMobileCorsHeaders } from "../../../../../../server/mobile/response";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setMobileCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST" && req.method !== "DELETE") return sendMobileError(req,res,405,"METHOD_NOT_ALLOWED","Use POST or DELETE");
  try {
    const session = customerSession(req);
    const result = req.method === "POST" ? await startLineLink(session,req.body) : await cancelLineLink(session,req.body?.intentId);
    return sendMobileOk(req,res,result);
  } catch (error) { return eventFailure(req,res,error); }
}
