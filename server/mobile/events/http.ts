import type { NextApiRequest, NextApiResponse } from "next";
import { requireMobileSession, type MobileAccountSessionPayload } from "../auth-session";
import { sendMobileOk, sendMobileError, setMobileCorsHeaders, type MobileErrorCode } from "../response";
import { InvalidAuthError } from "../../auth/errors";
import { classifyAuthFailure } from "../../auth/diagnostics";
import { EventError, invalidFields } from "./errors";
import { requireEventCustomer } from "./guard";
import { createEventClient } from "./config";
import { MobileEventService } from "./service";

export function customerSession(req: NextApiRequest): MobileAccountSessionPayload | null {
  let session;
  try { session = requireMobileSession(req); }
  catch (error) { if (error instanceof InvalidAuthError) throw new EventError(401, "INVALID_SESSION", "กรุณาเข้าสู่ระบบใหม่"); throw error; }
  if (!session) return null;
  if (!("primaryProvider" in session) || (session.primaryProvider !== "line" && session.primaryProvider !== "apple")) throw new EventError(403, "CUSTOMER_REQUIRED", "ต้องใช้บัญชีสมาชิก");
  return session;
}
export function eventFailure(req: NextApiRequest, res: NextApiResponse, error: unknown) {
  if (error instanceof EventError) return sendMobileError(req, res, error.status, error.code as MobileErrorCode, error.message);
  // Link-intent expiry/replay is not invalid customer authentication.
  if (error instanceof InvalidAuthError) return sendMobileError(req, res, 409, "LINK_INTENT_INVALID", "การเชื่อมต่อหมดอายุหรือถูกใช้งานแล้ว กรุณาเริ่มใหม่");
  const upstreamStatus = (error as { statusCode?: number })?.statusCode;
  const auth = classifyAuthFailure(error);
  const status = upstreamStatus || auth.status === 503 ? 503 : 500;
  return sendMobileError(req, res, status, status === 503 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR", "ระบบยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง");
}
type Operation = "list" | "detail" | "member" | "history" | "registration" | "submit" | "upload";
export function eventHandler(operation: Operation) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    setMobileCorsHeaders(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    const methods = operation === "member" ? ["GET", "POST"] : [operation === "submit" || operation === "upload" ? "POST" : "GET"];
    if (!methods.includes(req.method ?? "")) { res.setHeader("Allow", methods.join(", ")); return sendMobileError(req, res, 405, "METHOD_NOT_ALLOWED", "Method not allowed"); }
    try {
      const value = (key: string) => { const v = req.query[key]; if (v !== undefined && typeof v !== "string") return invalidFields(); return v; };
      const privateRoute = !["list", "detail"].includes(operation);
      const actor = privateRoute ? await requireEventCustomer(customerSession(req)) : null;
      const write = req.method === "POST";
      const service = new MobileEventService(createEventClient(write));
      let result: unknown, status = 200;
      if (operation === "list") result = await service.list({ q: value("q"), from: value("from"), to: value("to"), cursor: value("cursor"), ...(value("limit") ? { limit: Number(value("limit")) } : {}) });
      else if (operation === "detail") result = await service.detail(value("eventId") ?? "");
      else if (operation === "member") {
        if (write) result = await service.enroll(actor!.lineId, req.body);
        else { const member = await service.member(actor!.lineId); result = { member: service.memberSummary(member), capability: { canRegister: !!member, reason: member ? null : "MEMBER_REQUIRED" } }; }
      } else if (operation === "history") result = await service.history(actor!.lineId, { cursor: value("cursor"), ...(value("limit") ? { limit: Number(value("limit")) } : {}) });
      else if (operation === "registration") result = await service.registration(value("id") ?? "", actor!.lineId);
      else if (operation === "submit") {
        const registered = await service.submit(value("eventId") ?? "", actor!.lineId, req.body);
        result = { registration: await service.registration(registered.id, actor!.lineId), replayed: registered.replayed }; status = registered.replayed ? 200 : 201;
      } else {
        const chunks: Buffer[] = []; let length = 0;
        for await (const chunk of req) { const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); length += bytes.length;
          if (length > 4 * 1024 * 1024) throw new EventError(413, "IMAGE_TOO_LARGE", "รูปต้องไม่เกิน 4MB"); chunks.push(bytes); }
        result = await service.upload(value("eventId") ?? "", actor!.lineId, Buffer.concat(chunks)); status = 201;
      }
      return sendMobileOk(req, res, result, status);
    } catch (error) { return eventFailure(req, res, error); }
  };
}
