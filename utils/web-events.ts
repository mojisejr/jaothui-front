import type { MobileEventService } from "../server/mobile/events/service";

/** Public mobile DTO: web never maintains a second event catalogue or policy. */
export type WebEventPage = Awaited<ReturnType<MobileEventService["list"]>>;
export type WebEvent = WebEventPage["items"][number];
export type WebEventQuery = { q?: string; from?: string; to?: string; cursor?: string; limit?: number };

export function validateEventDates(from: string, to: string): string | null {
  const valid = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number(day.slice(0, 4)) >= 1900 && Number(day.slice(0, 4)) < 2400 && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;
  try {
    if ((from && !valid(from)) || (to && !valid(to))) return "กรุณาระบุวันที่ ค.ศ. ที่ถูกต้อง";
  } catch { return "กรุณาระบุวันที่ ค.ศ. ที่ถูกต้อง"; }
  return from && to && from > to ? "วันเริ่มต้นต้องไม่อยู่หลังวันสิ้นสุด" : null;
}

export function uniqueOpenEvents(items: WebEvent[]): WebEvent[] {
  return [...new Map(items.filter(item => item.publicRegistration === "open").map(item => [item.id, item])).values()];
}

export async function fetchWebEvents(query: WebEventQuery, signal: AbortSignal): Promise<WebEventPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
  const response = await fetch(`/api/web/events?${params}`, { signal, credentials: "omit" });
  if (!response.ok) throw new Error("โหลดงานประกวดไม่สำเร็จ กรุณาลองอีกครั้ง");
  const body: { ok?: boolean; data?: WebEventPage } = await response.json();
  const data = body.data;
  const nullableDay = (day: unknown) => day === null || (typeof day === "string" && validateEventDates(day, "") === null && day !== "");
  if (!body.ok || !data || !Array.isArray(data.items) || !Number.isInteger(data.totalOpen) || data.totalOpen < 0 ||
    !(data.nextCursor === null || typeof data.nextCursor === "string") || typeof data.observedAt !== "string" ||
    data.items.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string" ||
      !(item.location === null || typeof item.location === "string") || !(item.imageUrl === null || typeof item.imageUrl === "string") ||
      !nullableDay(item.competitionStartDay) || !nullableDay(item.competitionEndDay) ||
      !nullableDay(item.registrationStartDay) || !nullableDay(item.registrationDeadline) || item.publicRegistration !== "open")) throw new Error("ข้อมูลกิจกรรมไม่พร้อมใช้งาน กรุณาลองอีกครั้ง");
  return { ...data, items: uniqueOpenEvents(data.items) };
}

export function eventEntryHref(id: string): string {
  return `/v2/event-entry?eventId=${encodeURIComponent(id)}`;
}

export function eventDayLabel(day: string | null): string {
  if (!day) return "รอประกาศวันที่";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}
