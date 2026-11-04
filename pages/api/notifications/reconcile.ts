import type { NextApiRequest, NextApiResponse } from "next";
import { timingSafeEqual } from "crypto";
import { prisma } from "../../../server/prisma";
import { pushConfig, pushSource } from "../../../server/notifications/config";
import { PushError } from "../../../server/notifications/contracts";
import { failure, pushHeaders } from "../../../server/notifications/http";
import { runReminders } from "../../../server/notifications/engine";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  pushHeaders(res);
  try {
    if (req.method !== "GET" && req.method !== "POST")
      throw new PushError(405, "METHOD_NOT_ALLOWED");
    const key = process.env.JAOTHUI_PUSH_CRON_SECRET ?? "",
      actual = req.headers.authorization ?? "",
      expected = `Bearer ${key}`;
    if (
      key.length < 32 ||
      Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
    )
      throw new PushError(401, "UNAUTHENTICATED");
    if (pushConfig().mode === "off")
      return res.json({ ok: true, data: { mode: "off", stop: "disabled" } });
    const result = await runReminders(prisma, pushSource());
    // Structured aggregates only; no capabilities, credentials or applicant data.
    console.info("competition_push_run", result);
    return res
      .status(
        ["complete", "disabled", "already_running"].includes(result.stop)
          ? 200
          : 503,
      )
      .json({ ok: true, data: result });
  } catch (error) {
    return failure(res, error);
  }
}
