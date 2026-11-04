import { digest } from "./contracts";
export type ReminderEvent = {
  _id: string;
  _type?: string;
  title?: string;
  eventType?: unknown;
  competitionState?: unknown;
  isActive?: unknown;
  startAt?: unknown;
  eventAt?: unknown;
  endAt?: unknown;
};
export function competitionDay(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value))
    return null;
  const day = value.slice(0, 10),
    time = Date.parse(`${day}T00:00:00Z`);
  if (
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== day ||
    (value.length > 10 && !Number.isFinite(Date.parse(value)))
  )
    return null;
  return day;
}
export function reminderSlot(event: ReminderEvent) {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(event._id) ||
    event._id.includes("..") ||
    /^(drafts|versions|_)\./.test(event._id) ||
    event.competitionState === "draft" ||
    event.competitionState === "closed" ||
    event.isActive === false
  )
    return null;
  if (event.eventType !== "normal" && event.eventType !== "royal") return null;
  const startDay = competitionDay(event.startAt ?? event.eventAt);
  if (!startDay) return null;
  if (
    event.endAt != null &&
    (!competitionDay(event.endAt) || competitionDay(event.endAt)! < startDay)
  )
    return null;
  const expiresAt = new Date(`${startDay}T00:00:00+07:00`);
  const dueAt = new Date(expiresAt.getTime() - 15 * 60 * 60 * 1000); // prior day 09:00 Bangkok
  return {
    eventId: event._id,
    startDay,
    dueAt,
    expiresAt,
    slot: "d-1-09:00-bangkok",
    schedule: digest(`v1:${startDay}:Asia/Bangkok`),
  };
}
export function eligible(
  event: ReminderEvent,
  approval?: { approvementResult?: unknown } | null,
) {
  return (
    event.eventType === "normal" ||
    (event.eventType === "royal" && approval?.approvementResult === true)
  );
}
export function bangkokDay(now: Date) {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
export function tomorrowDay(now: Date) {
  return new Date(now.getTime() + (24 + 7) * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
