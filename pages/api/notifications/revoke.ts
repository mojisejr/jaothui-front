import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "../../../server/prisma";
import {
  installationId,
  PushError,
} from "../../../server/notifications/contracts";
import { revokeInstallation } from "../../../server/notifications/installations";
import { failure, pushHeaders } from "../../../server/notifications/http";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  pushHeaders(res);
  try {
    if (req.method !== "POST") throw new PushError(405, "METHOD_NOT_ALLOWED");
    const input = z
      .object({ installationId, revocationToken: z.string().max(80) })
      .strict()
      .safeParse(req.body);
    if (!input.success) throw new PushError(400, "INVALID_REVOCATION");
    return res.json({
      ok: true,
      data: await revokeInstallation(
        prisma,
        input.data.installationId,
        input.data.revocationToken,
      ),
    });
  } catch (error) {
    return failure(res, error);
  }
}
