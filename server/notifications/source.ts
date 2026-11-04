import type { SanityClient } from "@sanity/client";
import { eligible, type ReminderEvent } from "./policy";
export type ReminderRegistration = {
  _id: string;
  lineId: string;
  approval?: { approvementResult?: unknown };
};
export class ReminderSource {
  constructor(
    private client: SanityClient,
    private count: () => Promise<void>,
  ) {}
  async events(day: string, after = "", take = 50) {
    await this.count();
    return this.client.fetch<ReminderEvent[]>(
      `*[_type=="event" && !(_id in path("drafts.**")) && _id>$after && string::startsWith(coalesce(startAt,eventAt),$day)]|order(_id asc)[0...$take]{_id,title,eventType,competitionState,isActive,startAt,eventAt,endAt}`,
      { day, after, take },
    );
  }
  async registrations(eventId: string, after = "", take = 100) {
    await this.count();
    return this.client.fetch<ReminderRegistration[]>(
      `*[_type=="eventRegister" && !(_id in path("drafts.**")) && event._ref==$eventId && _id>$after]|order(_id asc)[0...$take]{_id,"lineId":user._ref,"approval":*[_type=="approvment" && event._ref==$eventId && eventRegister._ref==^._id]|order(coalesce(approvementDate,_updatedAt,_createdAt) desc,_id desc)[0]{approvementResult}}`,
      { eventId, after, take },
    );
  }
  async stillEligible(eventId: string, lineId: string) {
    await this.count();
    const result = await this.client.fetch<{
      event: ReminderEvent | null;
      registrations: ReminderRegistration[];
    }>(
      `{"event":*[_type=="event" && _id==$eventId][0]{_id,title,eventType,competitionState,isActive,startAt,eventAt,endAt},"registrations":*[_type=="eventRegister" && !(_id in path("drafts.**")) && event._ref==$eventId && user._ref==$lineId && (event->eventType=="normal" || (*[_type=="approvment" && event._ref==$eventId && eventRegister._ref==^._id]|order(coalesce(approvementDate,_updatedAt,_createdAt) desc,_id desc)[0].approvementResult)==true)][0...1]{_id,"lineId":user._ref,"approval":*[_type=="approvment" && event._ref==$eventId && eventRegister._ref==^._id]|order(coalesce(approvementDate,_updatedAt,_createdAt) desc,_id desc)[0]{approvementResult}}}`,
      { eventId, lineId },
    );
    return {
      event: result.event,
      eligible:
        !!result.event &&
        result.registrations.some((r) => eligible(result.event!, r.approval)),
    };
  }
}

export async function freshAudience(
  client: SanityClient,
  count: () => Promise<void>,
  eventId: string,
  lineIds: string[],
) {
  await count();
  return client.fetch<{ event: ReminderEvent | null; lineIds: string[] }>(
    `{"event":*[_type=="event" && _id==$eventId][0]{_id,title,eventType,competitionState,isActive,startAt,eventAt,endAt},"lineIds":array::unique(*[_type=="eventRegister" && !(_id in path("drafts.**")) && event._ref==$eventId && user._ref in $lineIds && (event->eventType=="normal" || (event->eventType=="royal" && (*[_type=="approvment" && event._ref==$eventId && eventRegister._ref==^._id]|order(coalesce(approvementDate,_updatedAt,_createdAt) desc,_id desc)[0].approvementResult)==true))].user._ref)}`,
    { eventId, lineIds },
  );
}
