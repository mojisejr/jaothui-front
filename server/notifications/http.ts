import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getCookie } from "cookies-next";
import { prisma } from "../prisma";
import { requireMobileAccountSession } from "../mobile/auth-session";
import { resolvePrincipal } from "../auth/event-sso";
import { installationId, PushError } from "./contracts";
import { pushConfig } from "./config";
import {
  disableInstallation,
  registerInstallation,
  revokeInstallation,
} from "./installations";
import { InvalidAuthError } from "../auth/errors";

export function pushHeaders(res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
}
export function failure(res: NextApiResponse, error: unknown) {
  const known =
    error instanceof PushError ||
    (error &&
      typeof error === "object" &&
      "status" in error &&
      "code" in error);
  const status =
    error instanceof InvalidAuthError
      ? 401
      : known
        ? Number((error as PushError).status)
        : 503;
  const code =
    error instanceof InvalidAuthError
      ? "UNAUTHENTICATED"
      : known
        ? String((error as PushError).code)
        : "PUSH_UNAVAILABLE";
  return res.status(status >= 400 && status < 600 ? status : 503).json({
    ok: false,
    error: { code, message: "ไม่สามารถจัดการการแจ้งเตือนได้ กรุณาลองใหม่" },
  });
}
export function requirePushOrigin(req: NextApiRequest) {
  const origin = process.env.JAOTHUI_FRONT_ORIGIN || "https://www.jaothui.com";
  if (
    req.headers.origin !== origin ||
    req.headers["sec-fetch-site"] === "cross-site"
  )
    throw new PushError(403, "CSRF_REJECTED");
}
export async function pushAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  native: boolean,
) {
  const session = native ? requireMobileAccountSession(req) : null;
  if (session?.primaryProvider === "reviewer")
    throw new PushError(403, "ACCOUNT_INACTIVE");
  if (native && !session) throw new PushError(401, "UNAUTHENTICATED");
  const id = native
    ? session!.accountId
    : (await resolvePrincipal({ req, res }, prisma, { requireSso: false }))
        .accountId;
  const account = await prisma.account.findUnique({ where: { id } });
  if (
    !account ||
    account.status !== "ACTIVE" ||
    account.deletedAt ||
    account.role === "REVIEWER_SANDBOX"
  )
    throw new PushError(403, "ACCOUNT_INACTIVE");
  return id;
}
export function installationHandler(native: boolean) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    pushHeaders(res);
    try {
      if (!["GET", "PUT", "DELETE"].includes(req.method ?? ""))
        throw new PushError(405, "METHOD_NOT_ALLOWED");
      const config = pushConfig();
      if (req.method === "GET" && !config.available)
        return res.json({
          ok: true,
          data: { available: false, enabled: false, bindingGeneration: null },
        });
      if (req.method === "PUT" && !config.available)
        throw new PushError(503, "PUSH_UNAVAILABLE");
      if (!native && req.method !== "GET") requirePushOrigin(req);
      const accountId = await pushAccount(req, res, native);
      if (req.method === "PUT") {
        const platform = req.body?.platform;
        if (
          native ? !["ios", "android"].includes(platform) : platform !== "web"
        )
          throw new PushError(400, "INVALID_INSTALLATION");
        return res.json({
          ok: true,
          data: await registerInstallation(prisma, accountId, req.body),
        });
      }
      const id = installationId.safeParse(
        req.method === "GET"
          ? req.query.installationId
          : req.body?.installationId,
      );
      if (!id.success) throw new PushError(400, "INVALID_INSTALLATION");
      if (req.method === "DELETE")
        return res.json({
          ok: true,
          data: await disableInstallation(prisma, accountId, id.data),
        });
      const row = await prisma.notificationInstallation.findFirst({
        where: { id: id.data, accountId },
      });
      return res.json({
        ok: true,
        data: {
          available: config.available,
          enabled: row?.enabled ?? false,
          bindingGeneration: row?.generation ?? null,
        },
      });
    } catch (error) {
      return failure(res, error);
    }
  };
}
export async function revokeCurrentWebInstallation(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const value = getCookie("jaothui_push_installation", { req, res });
  const proof = z
    .object({
      installationId,
      revocationToken: z.string().regex(/^\d{1,10}\.[A-Za-z0-9_-]{43}$/),
    })
    .strict()
    .safeParse(req.body?.pushRevocation);
  let processed = false;
  if (
    !proof.success &&
    (typeof value !== "string" || !installationId.safeParse(value).success)
  )
    return false;
  requirePushOrigin(req);
  try {
    if (proof.success) {
      await revokeInstallation(
        prisma,
        proof.data.installationId,
        proof.data.revocationToken,
      );
      processed = true;
    }
    if (typeof value !== "string" || !installationId.safeParse(value).success)
      return processed;
    let accountId: string;
    try {
      accountId = await pushAccount(req, res, false);
    } catch (error) {
      // Expired cookies must still be clearable. A persisted narrow capability
      // above (or client's queued /revoke) handles consent independently of JWT.
      if (
        error instanceof InvalidAuthError ||
        (error as { status?: number }).status === 401
      )
        return processed;
      throw error;
    }
    await disableInstallation(prisma, accountId, value);
    return processed;
  } catch (error) {
    if (
      (error as { code?: string; meta?: { table?: string } }).code !==
        "P2021" ||
      !(error as { meta?: { table?: string } }).meta?.table?.includes(
        "NotificationInstallation",
      )
    )
      throw error;
    return false;
  }
}
