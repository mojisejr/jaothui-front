import type { NextApiRequest, NextApiResponse } from "next";

import { requireNewsAdminRequest } from "../../../../../server/admin/news-event-admin-auth";
import { archiveNewsEventForAdmin } from "../../../../../server/admin/news-event-admin.service";
import {
  sendNewsAdminError,
  sendNewsAdminJson,
} from "../../../../../server/admin/news-event-admin-http";

function getId(req: NextApiRequest): string {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id ?? "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireNewsAdminRequest(req);

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendNewsAdminJson(res, { error: "METHOD_NOT_ALLOWED" }, 405);
    }

    const id = getId(req);
    if (!id) return sendNewsAdminJson(res, { error: "MISSING_ID" }, 400);

    return sendNewsAdminJson(res, {
      item: await archiveNewsEventForAdmin(id),
    });
  } catch (error) {
    return sendNewsAdminError(res, error);
  }
}
