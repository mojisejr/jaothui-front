import type { NextApiRequest, NextApiResponse } from "next";

import { requireNewsAdminRequest } from "../../../../server/admin/news-event-admin-auth";
import {
  createNewsEventForAdmin,
  listNewsEventsForAdmin,
} from "../../../../server/admin/news-event-admin.service";
import { newsEventAdminUpsertInputSchema } from "../../../../server/admin/news-event-admin-contract";
import {
  sendNewsAdminError,
  sendNewsAdminJson,
} from "../../../../server/admin/news-event-admin-http";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireNewsAdminRequest(req);

    if (req.method === "GET") {
      return sendNewsAdminJson(res, { items: await listNewsEventsForAdmin() });
    }

    if (req.method === "POST") {
      const input = newsEventAdminUpsertInputSchema.parse(req.body);
      return sendNewsAdminJson(
        res,
        { item: await createNewsEventForAdmin(input) },
        201
      );
    }

    res.setHeader("Allow", "GET, POST");
    return sendNewsAdminJson(res, { error: "METHOD_NOT_ALLOWED" }, 405);
  } catch (error) {
    return sendNewsAdminError(res, error);
  }
}
