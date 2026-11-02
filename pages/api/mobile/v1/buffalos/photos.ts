import type { NextApiRequest, NextApiResponse } from "next";
import { readPublishedPhotos } from "../../../../../server/photos/batch-service";
import { parsePhotoSelector, type PhotoSelector } from "../../../../../utils/photo-contract";
import { requireMethod, sendMobileError, sendMobileOk } from "../../../../../server/mobile/response";

export const config = { api: { bodyParser: { sizeLimit: "2kb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, "POST")) return;
  let ids: PhotoSelector;
  try {
    if (Buffer.byteLength(JSON.stringify(req.body) ?? "", "utf8") > 2048) throw new Error("INVALID_PHOTO_IDENTITIES");
    ids = parsePhotoSelector(req.body);
  } catch {
    return sendMobileError(req, res, 400, "BAD_REQUEST", "Provide 1–40 public token ID strings");
  }
  try {
    return sendMobileOk(req, res, { photos: await readPublishedPhotos(ids) });
  } catch {
    res.setHeader("Retry-After", "5");
    return sendMobileError(req, res, 503, "SERVICE_UNAVAILABLE", "Photo refresh temporarily unavailable");
  }
}
