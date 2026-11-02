import Link from "next/link";
import { RemoteImage } from "./RemoteImage";
import { buttonVariants } from "./Button";
import { eventDayLabel, eventEntryHref, type WebEvent } from "../../utils/web-events";

export function EventPreviewCard({ event }: { event: WebEvent }) {
  return (
    <article className="overflow-hidden rounded-card border border-border-soft bg-surface">
      <div className="relative aspect-video w-full bg-surface">
        <RemoteImage key={event.imageUrl} src={event.imageUrl} alt={`โปสเตอร์ ${event.name}`} className="object-contain" sizes="(max-width: 767px) 90vw, 640px" />
      </div>
      <div className="space-y-3 p-4">
        <h3 className="break-words text-lg font-semibold leading-relaxed text-foreground">{event.name}</h3>
        <p className="text-sm leading-6 text-muted">วันแข่งขัน: {eventDayLabel(event.competitionStartDay)}{event.competitionEndDay && event.competitionEndDay !== event.competitionStartDay ? ` – ${eventDayLabel(event.competitionEndDay)}` : ""}</p>
        <p className="break-words text-sm leading-6 text-muted">สถานที่: {event.location || "รอประกาศสถานที่"}</p>
        <Link href={eventEntryHref(event.id)} className={buttonVariants({ variant: "gold-fill", size: "md" })} aria-label={`สมัครงาน ${event.name}`}>ดูรายละเอียด / สมัคร</Link>
      </div>
    </article>
  );
}
