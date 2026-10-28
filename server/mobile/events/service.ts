import { createHash } from "crypto";
import type { SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { z } from "zod";
import { getCompetitionPolicy, calculateRegistrationAge, competitionDay } from "./competition-policy";
import { getPossibleEvents, getSpecialEvents } from "./class-options";
import { normalizeClassName } from "./competition-classes";
import { EventError, invalidFields } from "./errors";
import { scopedApplicantImage } from "./image";

export const SOURCE_PIN = "914da59ff9cbf287da8a5fb00276bef59f7604af";
export const docId = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/).refine(value => !value.includes(".."));
const reservedId = (id: string) => /^(drafts|versions|_)\./.test(id);
const text = z.string().max(300);
// Preserve source request bytes for idempotency; validate without trimming them.
const required = text.refine(value => value.trim().length > 0);
const date = z.string().refine(value => value.length === 10 && competitionDay(value) === value);
const ref = (id: string) => ({ _type: "reference", _ref: id });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const normalFields = { operationId: z.string().uuid(), type: required, level: z.enum(["จังหวัด", "ประเทศ"]), name: required,
  sex: z.enum(["male", "female"]), color: z.enum(["black", "albino"]), birthdate: date, microchip: text,
  ownerName: required, ownerTel: required, fatherName: required, motherName: required, farmName: required, province: required,
  // Compatibility input for SOURCE request hashing only. Never used as persisted/calculated age.
  buffaloAge: z.number().finite().nonnegative().max(1200) };
const accepts = (keys: string[]) => z.object(Object.fromEntries(keys.map(key => [key, z.literal(true)]))).strict();
export const normalSubmit = z.object({ ...normalFields, agreements: accepts(["accept1", "accept2", "accept3", "accept4"]) }).strict();
export const royalSubmit = z.object({ ...normalFields, address: required, district: required, amphoe: required,
  zipcode: required, imageIds: z.array(z.string().regex(/^image-[a-f0-9]+-\d+x\d+-(jpeg|jpg|png|webp)$/)).length(5),
  agreements: accepts(["d1Accept", "d2Accept", "d3Accept", ...Array.from({ length: 9 }, (_, i) => `accept${i + 1}`)]) }).strict();
export type EventDocument = Record<string, any>;

/** Identical top-level sorted-key serialization and token/image exclusions to the pinned source. */
export function registrationIdentity(data: { eventId: string; userId: string; operationId: string }, payload: Record<string, unknown>) {
  return { id: `competition-registration.${digest(`${data.eventId}:${data.userId}:${data.operationId}`)}`,
    hash: digest(JSON.stringify(payload, Object.keys(payload).filter(key => !["idToken", "lineAccessToken", "imageIds", "buffaloImage", "buffaloImage2", "frontImage", "sideImage", "backImage"].includes(key)).sort())) };
}

export function sourcePayload(eventId: string, userId: string, input: unknown, royal: boolean) {
  const parsed = (royal ? royalSubmit : normalSubmit).safeParse(input);
  if (!parsed.success) return invalidFields();
  const { agreements: _agreements, ...body } = parsed.data;
  if (royal) return { ...body, eventId, userId, birthday: body.birthdate };
  const { birthdate, ...rest } = body;
  return { ...rest, eventId, userId, birthday: birthdate };
}

export class MobileEventService {
  constructor(public client: SanityClient, public now: () => Date = () => new Date()) {}
  async event(id: string) {
    if (!docId.safeParse(id).success || reservedId(id)) throw new EventError(404, "EVENT_NOT_FOUND", "ไม่พบกิจกรรม");
    const event = await this.client.getDocument<EventDocument>(id);
    if (!event || event._type !== "event" || !getCompetitionPolicy(event, this.now()).publicVisible) throw new EventError(404, "EVENT_NOT_FOUND", "ไม่พบกิจกรรม");
    return event;
  }
  summary(event: EventDocument) {
    let imageUrl: string | null = null;
    try { imageUrl = event.image ? imageUrlBuilder(this.client).image(event.image).url() : null; } catch {}
    return { id: event._id, name: event.title ?? "", eventType: event.eventType === "royal" ? "royal" : "normal", imageUrl,
      competitionStartDay: competitionDay(event.startAt ?? event.eventAt), competitionEndDay: competitionDay(event.endAt),
      registrationStartDay: competitionDay(event.registrationStartAt), registrationDeadline: competitionDay(event.registrationDeadline),
      publicRegistration: getCompetitionPolicy(event, this.now()).publicRegistration, location: event.location ?? null };
  }
  async list(input: { q?: string; from?: string; to?: string; limit?: number; cursor?: string } = {}) {
    const parsed = z.object({ q: z.string().trim().max(100).optional(), from: date.optional(), to: date.optional(),
      limit: z.number().int().min(1).max(20).default(20), cursor: z.string().max(400).optional() }).strict().safeParse(input);
    if (!parsed.success) return invalidFields();
    const args = parsed.data;
    if (args.from && args.to && args.from > args.to) return invalidFields();
    const docs = await this.client.fetch<EventDocument[]>('*[_type == "event" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))][0...5001]');
    if (docs.length > 5000) throw new EventError(503, "EVENTS_UNAVAILABLE", "กรุณาลองใหม่ภายหลัง");
    const open = docs.filter(e => !reservedId(e._id) && getCompetitionPolicy(e, this.now()).publicRegistration === "open").map(e => this.summary(e));
    const key = (e: ReturnType<MobileEventService["summary"]>) => `${e.competitionStartDay ?? ""}:${e.id}`;
    const sorted = open.filter(e => (!args.q || e.name.toLocaleLowerCase().includes(args.q.toLocaleLowerCase())) &&
      (!args.from || (e.competitionEndDay && e.competitionEndDay >= args.from)) && (!args.to || (e.competitionStartDay && e.competitionStartDay <= args.to)))
      .sort((a, b) => key(a).localeCompare(key(b), "en"));
    let after = "";
    if (args.cursor) {
      try { const decoded = JSON.parse(Buffer.from(args.cursor, "base64url").toString());
        if (typeof decoded !== "string" || !/^(?:\d{4}-\d{2}-\d{2})?:[a-zA-Z0-9_.-]+$/.test(decoded)) return invalidFields(); after = decoded;
      } catch { return invalidFields(); }
    }
    const eligible = sorted.filter(e => !after || key(e).localeCompare(after, "en") > 0);
    const items = eligible.slice(0, args.limit), last = items[items.length - 1];
    return { items, totalOpen: open.length, nextCursor: eligible.length > items.length && last ? Buffer.from(JSON.stringify(key(last))).toString("base64url") : null, observedAt: this.now().toISOString() };
  }
  async catalogs(eventId: string, level?: string) {
    const types = level ? [level === "จังหวัด" ? "provinceEventType" : "nationalEventType"] : ["provinceEventType", "nationalEventType"];
    const ids = await this.client.fetch<{ _id: string }[]>('*[_type in $types && event._ref == $eventId]{_id}', { types, eventId });
    const docs = await Promise.all(ids.map(row => this.client.getDocument<EventDocument>(row._id)));
    return docs.filter(d => !!d && types.includes(d._type) && d.event?._ref === eventId && Array.isArray(d.data)) as EventDocument[];
  }
  async detail(id: string) {
    const event = await this.event(id), catalogs = await this.catalogs(id);
    return { ...this.summary(event), description: event.description ?? null, metadata: Array.isArray(event.metadata) ? event.metadata : [],
      ageCutoffDay: competitionDay(event.buffaloAgeDeadline ?? event.deadline), policy: getCompetitionPolicy(event, this.now()),
      catalogs: catalogs.map(c => ({ level: c._type === "provinceEventType" ? "จังหวัด" : "ประเทศ", labels: c.data })), formKind: event.eventType === "royal" ? "royal" : "normal" };
  }
  async member(lineId: string) {
    const found = await this.client.fetch<EventDocument[]>('*[_type == "user" && (lineId == $lineId || _id == $lineId)]', { lineId });
    if (found.length > 1 || (found[0] && (found[0]._id !== lineId || found[0].lineId !== lineId))) throw new EventError(409, "MEMBER_AMBIGUOUS", "กรุณาติดต่อเจ้าหน้าที่เพื่อตรวจสอบสมาชิก");
    return found[0] ?? null;
  }
  memberSummary(member: EventDocument | null) {
    return member ? { id: member._id, tel: member.tel ?? null, email: member.email ?? null, role: member.role } : null;
  }
  async enroll(lineId: string, input: unknown) {
    const fields = z.object({ firstName: required, lastName: required, tel: required, email: z.string().email().max(254).nullable().optional() }).strict().safeParse(input);
    if (!fields.success) return invalidFields();
    const existing = await this.member(lineId);
    if (existing) return { member: this.memberSummary(existing), created: false };
    const member = await this.client.createIfNotExists({ _id: lineId, _type: "user", lineId, tel: fields.data.tel, email: fields.data.email ?? null, role: "USER" });
    if (member._type !== "user" || member.lineId !== lineId) throw new EventError(409, "MEMBER_AMBIGUOUS", "กรุณาติดต่อเจ้าหน้าที่เพื่อตรวจสอบสมาชิก");
    return { member: this.memberSummary(member), created: true };
  }
  async requireMember(lineId: string) {
    const member = await this.client.getDocument<EventDocument>(lineId);
    if (!member || member._type !== "user" || member.lineId !== lineId) throw new EventError(403, "MEMBER_REQUIRED", "กรุณาสมัครสมาชิกกิจกรรมก่อน");
    // Query detects legacy ambiguous aliases; the actual canonical document above is a strong read.
    await this.member(lineId);
    return member;
  }
  registrationSummary(row: EventDocument) {
    const e = row.event;
    const approval = row.approval;
    return { id: row._id, event: { id: e._id, name: e.title, eventType: e.eventType ?? "normal", startDay: e.startAt, endDay: e.endAt },
      buffalo: { name: row.name, microchip: row.microchip, sex: row.sex, color: row.color, birthday: row.birthday, age: row.buffaloAge, type: row.type, level: row.level },
      status: e.eventType !== "royal" ? "registered" : approval?.approvementResult === true ? "approved" : approval?.approvementResult === false ? "rejected" : "pending",
      approvalComment: approval?.comment ?? null, createdAt: row._createdAt };
  }
  async history(lineId: string, input: { limit?: number; cursor?: string } = {}) {
    const args = z.object({ limit: z.number().int().min(1).max(20).default(20), cursor: z.string().max(500).optional() }).strict().safeParse(input);
    if (!args.success) return invalidFields();
    let stamp = "9999", id = "~";
    if (args.data.cursor) {
      try { const pair = JSON.parse(Buffer.from(args.data.cursor, "base64url").toString());
        if (!Array.isArray(pair) || pair.length !== 2 || !z.string().datetime().safeParse(pair[0]).success || !docId.safeParse(pair[1]).success) return invalidFields();
        [stamp, id] = pair;
      } catch { return invalidFields(); }
    }
    const rows = await this.client.fetch<EventDocument[]>('*[_type=="eventRegister" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && user._ref==$lineId && defined(event->_id) && coalesce(event->competitionState,"published")!="draft" && !(event._ref in path("drafts.**")) && !(event._ref in path("versions.**")) && (_createdAt<$stamp || (_createdAt==$stamp && _id<$id))] | order(_createdAt desc,_id desc)[0...$take]{...,"event":event->,"approval":*[_type=="approvment" && eventRegister._ref==^._id][0]{approvementResult,comment}}', { lineId, stamp, id, take: args.data.limit + 1 });
    const items = rows.slice(0, args.data.limit), last = items[items.length - 1];
    return { items: items.map(row => this.registrationSummary(row)), nextCursor: rows.length > items.length && last ? Buffer.from(JSON.stringify([last._createdAt, last._id])).toString("base64url") : null };
  }
  async registration(id: string, lineId: string) {
    if (!docId.safeParse(id).success || reservedId(id)) throw new EventError(404, "REGISTRATION_NOT_FOUND", "ไม่พบใบสมัคร");
    const row = await this.client.getDocument<EventDocument>(id);
    if (!row || row._type !== "eventRegister" || row.user?._ref !== lineId) throw new EventError(404, "REGISTRATION_NOT_FOUND", "ไม่พบใบสมัคร");
    const event = await this.event(row.event?._ref), supplement = await this.client.fetch<{ approval: any; images: any; address: any }>(' {"approval":*[_type=="approvment" && eventRegister._ref==$id][0]{approvementResult,comment},"images":*[_type=="eventImage" && eventRegister._ref==$id && user._ref==$lineId][0].imageArray[]{imageTitle,"url":imageAsset.asset->url},"address":*[_type=="eventAddress" && eventRegister._ref==$id && user._ref==$lineId][0]{address,district,amphoe,province,zipcode}}', { id, lineId });
    return { ...this.registrationSummary({ ...row, event, approval: supplement.approval }), ownerName: row.ownerName, ownerTel: row.ownerTel,
      fatherName: row.fatherName, motherName: row.motherName, farmName: row.farmName, province: row.province,
      ...(event.eventType === "royal" ? { images: supplement.images ?? [], address: supplement.address ?? null } : {}) };
  }
  async submit(eventId: string, lineId: string, input: unknown) {
    // Freeze the source-shaped request before reading mutable event rules. Replay
    // stays valid after closure/type edits; a fresh request must match current kind.
    if (!docId.safeParse(eventId).success || reservedId(eventId)) return invalidFields();
    const royal = royalSubmit.safeParse(input).success;
    const payload = sourcePayload(eventId, lineId, input, royal) as Record<string, any>;
    const identity = registrationIdentity({ eventId, userId: lineId, operationId: payload.operationId }, payload);
    const replay = async () => {
      const found = await this.client.getDocument<EventDocument>(identity.id);
      if (found && (found._type !== "eventRegister" || found.user?._ref !== lineId || found.event?._ref !== eventId || found.registrationRequestHash !== identity.hash)) throw new EventError(409, "OPERATION_CONFLICT", "คำขอนี้ถูกใช้กับข้อมูลอื่นแล้ว กรุณาเริ่มคำขอใหม่");
      return found;
    };
    const existing = await replay();
    if (existing) return { id: existing._id, replayed: true };
    await this.requireMember(lineId);
    const event = await this.event(eventId);
    if ((event.eventType === "royal") !== royal) throw new EventError(422, "INVALID_FIELDS", "กรุณาใช้แบบฟอร์มของกิจกรรมนี้");
    if (getCompetitionPolicy(event, this.now()).publicRegistration !== "open") throw new EventError(409, "REGISTRATION_CLOSED", "กิจกรรมนี้ไม่เปิดรับสมัครในขณะนี้");
    let age: number;
    try { age = calculateRegistrationAge(event, payload.birthday, payload.color); } catch { throw new EventError(422, "INVALID_AGE", "วันเกิดหรือวันตัดอายุไม่ถูกต้อง"); }
    const catalogs = await this.catalogs(eventId, payload.level), labels = catalogs.flatMap(c => c.data as string[]);
    const allowed = [...getPossibleEvents(age, labels), ...getSpecialEvents(labels, age)];
    const chosen = allowed.find(label => normalizeClassName(label) === normalizeClassName(payload.type));
    if (!chosen) throw new EventError(422, "INVALID_CLASS", "รุ่นการแข่งขันไม่ตรงกับอายุหรือชุดรุ่นของงาน");
    if (royal) {
      const owned = await Promise.all(payload.imageIds.map((id: string) => this.client.getDocument<EventDocument>(id)));
      if (new Set(payload.imageIds).size !== 5 || owned.some((asset: EventDocument | undefined) => asset?._type !== "sanity.imageAsset" || asset.source?.id !== `competition:${eventId}:${lineId}`)) throw new EventError(422, "INVALID_ASSET_OWNERSHIP", "กรุณาอัพโหลดรูปให้ครบและถูกต้อง");
    }
    const registration: EventDocument = { _id: identity.id, _type: "eventRegister", registrationRequestHash: identity.hash,
      type: normalizeClassName(chosen), buffaloAge: age, user: ref(lineId), event: ref(eventId) };
    for (const key of ["level", "name", "sex", "color", "birthday", "microchip", "ownerName", "ownerTel", "fatherName", "motherName", "farmName", "province"]) registration[key] = payload[key];
    const transaction = this.client.transaction().patch(eventId, patch => patch.ifRevisionId(event._rev).setIfMissing({ competitionWriteFence: 0, competitionRegistrationCount: 0 }).inc({ competitionWriteFence: 1, competitionRegistrationCount: 1 })).create(registration as any);
    if (royal) {
      const refs = { event: ref(eventId), eventRegister: ref(identity.id) };
      transaction.create({ _id: `${identity.id}.images`, _type: "eventImage", ...refs, user: ref(lineId), imageArray: payload.imageIds.map((id: string, index: number) => ({ _key: String(index), imageTitle: ["ภาพประจำตัวสัตว์ (ภาพที่ 1)", "ภาพประจำตัวสัตว์ (ภาพที่ 2)", "ภาพถ่ายหน้าตรงกระบือ", "ภาพถ่ายด้านข้างกระบือ", "ภาพถ่ายด้านท้ายกระบือ"][index], imageAsset: { _type: "image", asset: ref(id) } })) });
      transaction.create({ _id: `${identity.id}.approval`, _type: "approvment", ...refs, eventImage: ref(`${identity.id}.images`) });
      transaction.create({ _id: `${identity.id}.address`, _type: "eventAddress", ...refs, user: ref(lineId), address: payload.address, district: payload.district, amphoe: payload.amphoe, province: payload.province, zipcode: payload.zipcode });
    }
    try { await transaction.commit(); }
    catch (error) {
      const found = await replay();
      if (found) return { id: found._id, replayed: true };
      if ((error as { statusCode?: number }).statusCode === 409) throw new EventError(409, "EVENT_REVISION_CONFLICT", "ข้อมูลกิจกรรมเปลี่ยนแล้ว กรุณาตรวจสอบใหม่");
      throw error;
    }
    return { id: identity.id, replayed: false };
  }
  async upload(eventId: string, lineId: string, bytes: Buffer) {
    await this.requireMember(lineId);
    const event = await this.event(eventId);
    if (getCompetitionPolicy(event, this.now()).publicRegistration !== "open") throw new EventError(409, "REGISTRATION_CLOSED", "กิจกรรมนี้ไม่เปิดรับสมัครในขณะนี้");
    const owner = `competition:${eventId}:${lineId}`, image = scopedApplicantImage(bytes, owner);
    const existing = await this.client.getDocument<EventDocument>(image.id);
    const owned = (asset: EventDocument) => asset._type === "sanity.imageAsset" && asset.source?.id === owner;
    if (existing) {
      if (!owned(existing)) throw new EventError(422, "INVALID_ASSET_OWNERSHIP", "รูปนี้ถูกใช้กับใบสมัครอื่น กรุณาเลือกภาพอื่น");
      return { assetId: existing._id };
    }
    // Upload WITHOUT metadata first: a concurrent same-byte upload must never
    // overwrite another owner's source tag through Sanity's asset deduplication.
    const uploaded = await this.client.assets.upload("image", image.bytes);
    if (uploaded._id !== image.id) throw new EventError(503, "EVENTS_UNAVAILABLE", "ไม่สามารถตรวจสอบรูปภาพได้");
    const asset = await this.client.getDocument<EventDocument>(image.id);
    if (!asset) throw new EventError(503, "EVENTS_UNAVAILABLE", "ไม่สามารถตรวจสอบรูปภาพได้");
    if (asset.source?.id) {
      if (!owned(asset)) throw new EventError(422, "INVALID_ASSET_OWNERSHIP", "รูปนี้ถูกใช้กับใบสมัครอื่น");
      return { assetId: image.id };
    }
    try { await this.client.patch(image.id).ifRevisionId(asset._rev).set({ source: { ...(asset.source ?? {}), id: owner, name: asset.source?.name ?? "competition-applicant" } }).commit(); }
    catch (error) {
      const winner = await this.client.getDocument<EventDocument>(image.id);
      if (!winner || !owned(winner)) {
        if ((error as { statusCode?: number }).statusCode === 409) throw new EventError(422, "INVALID_ASSET_OWNERSHIP", "รูปนี้ถูกใช้กับใบสมัครอื่น");
        throw error;
      }
    }
    const assigned = await this.client.getDocument<EventDocument>(image.id);
    if (!assigned || !owned(assigned)) throw new EventError(422, "INVALID_ASSET_OWNERSHIP", "ไม่สามารถยืนยันเจ้าของรูปภาพได้");
    return { assetId: image.id };
  }
}
