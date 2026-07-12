import type { NextApiRequest, NextApiResponse } from "next";

import { requireNewsAdminRequest } from "../../../../server/admin/news-event-admin-auth";
import { newsEventAdminUpsertInputSchema } from "../../../../server/admin/news-event-admin-contract";
import {
  getNewsEventForAdmin,
  updateNewsEventForAdmin,
} from "../../../../server/admin/news-event-admin.service";
import {
  sendNewsAdminError,
  sendNewsAdminJson,
} from "../../../../server/admin/news-event-admin-http";

function getId(req: NextApiRequest): string {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id ?? "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireNewsAdminRequest(req);

    const id = getId(req);
    if (!id) return sendNewsAdminJson(res, { error: "MISSING_ID" }, 400);

    if (req.method === "GET") {
      return sendNewsAdminJson(res, { item: await getNewsEventForAdmin(id) });
    }

    if (req.method === "PATCH") {
      const input = newsEventAdminUpsertInputSchema.parse(req.body);
      return sendNewsAdminJson(res, {
        item: await updateNewsEventForAdmin(id, input),
      });
    }

    res.setHeader("Allow", "GET, PATCH");
    return sendNewsAdminJson(res, { error: "METHOD_NOT_ALLOWED" }, 405);
  } catch (error) {
    return sendNewsAdminError(res, error);
  }
}
