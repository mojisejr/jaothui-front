import type { NextApiRequest, NextApiResponse } from "next";

import { requireNewsAdminRequest } from "../../../../server/admin/news-event-admin-auth";
import { uploadNewsEventCoverForAdmin } from "../../../../server/admin/news-event-admin.service";
import {
  sendNewsAdminError,
  sendNewsAdminJson,
} from "../../../../server/admin/news-event-admin-http";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRequestBuffer(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireNewsAdminRequest(req);

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendNewsAdminJson(res, { error: "METHOD_NOT_ALLOWED" }, 405);
    }

    const contentType = req.headers["content-type"] ?? "";
    const filename =
      (Array.isArray(req.query.filename)
        ? req.query.filename[0]
        : req.query.filename) ?? "news-event-cover";
    const imageBuffer = await readRequestBuffer(req);

    if (imageBuffer.length === 0) {
      return sendNewsAdminJson(res, { error: "EMPTY_UPLOAD" }, 400);
    }

    return sendNewsAdminJson(res, {
      asset: await uploadNewsEventCoverForAdmin(
        imageBuffer,
        filename,
        Array.isArray(contentType) ? contentType[0] : contentType
      ),
    });
  } catch (error) {
    return sendNewsAdminError(res, error);
  }
}
