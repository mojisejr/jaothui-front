import { z } from "zod";
import { EventError } from "./errors";

const applicant = z.object({
  _id: z.string(), _rev: z.string(), _createdAt: z.string(), name: z.string(), microchip: z.string(),
  type: z.string(), level: z.string(), ownerName: z.string(), farmName: z.string(), birthday: z.string(),
  sex: z.string(), color: z.string(), buffaloAge: z.number().nullable(),
  event: z.object({ _id: z.string(), title: z.string(), startAt: z.string(), endAt: z.string(), eventType: z.string().optional() }),
  registrationPolicyVersion: z.literal(1), approvalRequirement: z.enum(["not_required", "required", "unknown"]),
  registrationStatus: z.enum(["registered", "pending", "accepted", "rejected", "needs_type_review"]),
  approvementResult: z.boolean().nullable(), comment: z.string().nullable(),
  checkInVersion: z.literal(1), checkInStatus: z.enum(["not_checked_in", "checked_in"]),
  checkedInAt: z.string().nullable(), qrAvailable: z.boolean(),
  checkInEligibility: z.object({ eligible: z.boolean(), reason: z.string().nullable() }),
});
export type SourceApplicant = z.infer<typeof applicant>;
export type ApplicantHistoryInput = { limit?: number; cursor?: string; period?: "active" | "past" | "all"; q?: string };
export interface ApplicantBridgeClient {
  history(owner: string, input: ApplicantHistoryInput): Promise<{ items: SourceApplicant[]; eventNames: string[]; nextCursor: string | null }>;
  status(owner: string, registrationId: string): Promise<SourceApplicant>;
  pass(owner: string, registrationId: string): Promise<{ application: SourceApplicant; qrUrl: string }>;
}
const unavailable = () => new EventError(503, "EVENTS_UNAVAILABLE", "ระบบใบสมัครหรือ QR ยังไม่พร้อมใช้งาน กรุณาลองใหม่");

export function createApplicantBridge(fetcher: typeof fetch = fetch, env: NodeJS.ProcessEnv = process.env): ApplicantBridgeClient {
  async function request<T>(action: string, owner: string, fields: object, schema: z.ZodType<T>): Promise<T> {
    const key = env.JAOTHUI_COMPETITION_APPLICANT_BRIDGE_KEY;
    let url: URL;
    try {
      const base = new URL(env.JAOTHUI_EVENT_APPLICANT_API_URL ?? "");
      const local = env.NODE_ENV !== "production" && base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname);
      if ((!local && base.protocol !== "https:") || base.username || base.password || base.search || base.hash || !key || key.length < 32) throw new Error();
      url = new URL("/api/competitions/mobile-applicant", base);
    } catch { throw unavailable(); }
    let response: Response;
    try {
      response = await fetcher(url.toString(), { method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ ...fields, action, owner }) });
    } catch { throw unavailable(); }
    if (!response.ok) {
      let code: unknown;
      try { const body = await response.text(); if (body.length < 16384) code = JSON.parse(body)?.error?.code; } catch {}
      if (response.status === 404 && ["NOT_FOUND", "APPLICATION_NOT_FOUND", "EVENT_NOT_FOUND"].includes(String(code))) throw new EventError(404, "REGISTRATION_NOT_FOUND", "ไม่พบใบสมัครของคุณ");
      if (response.status === 403 && code === "FORBIDDEN") throw new EventError(403, "QR_UNAVAILABLE", "ใบสมัครนี้ยังไม่พร้อมแสดง QR กรุณาโหลดข้อมูลล่าสุด");
      if (response.status === 409 && ["CONFLICT", "CHECKIN_INDEX_PENDING"].includes(String(code))) throw new EventError(409, "EVENT_REVISION_CONFLICT", "ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่");
      if (response.status === 422 && ["BAD_REQUEST", "INVALID_FIELDS"].includes(String(code))) throw new EventError(422, "INVALID_FIELDS", "กรุณาตรวจสอบข้อมูลคำขออีกครั้ง");
      // A missing/unauthenticated bridge is not an absent record or an invalid app login.
      throw unavailable();
    }
    try {
      const text = await response.text();
      if (text.length > 1024 * 1024) throw new Error();
      const parsed = z.object({ ok: z.literal(true), version: z.literal(1), data: z.unknown() }).safeParse(JSON.parse(text));
      if (!parsed.success) throw new Error();
      return schema.parse(parsed.data.data);
    } catch { throw unavailable(); }
  }
  return {
    history: (owner, input) => request("history", owner, input, z.object({ items: z.array(applicant).max(20), eventNames: z.array(z.string()), nextCursor: z.string().nullable() })),
    status: async (owner, registrationId) => {
      const result = await request("status", owner, { registrationId }, applicant);
      if (result._id !== registrationId) throw unavailable();
      return result;
    },
    pass: async (owner, registrationId) => {
      const result = await request("pass", owner, { registrationId }, z.object({ application: applicant, qrUrl: z.string().url().refine(s => { const u = new URL(s); return u.protocol === "https:" && !u.username && !u.password; }) }));
      if (result.application._id !== registrationId) throw unavailable();
      return result;
    },
  };
}
