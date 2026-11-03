import Link from "next/link";
import { FiArrowRight, FiMapPin } from "react-icons/fi";
import { RemoteImage } from "./RemoteImage";
import { buttonVariants } from "./Button";
import { cn } from "./cn";
import { eventDayLabel, eventEntryHref, type WebEvent } from "../../utils/web-events";

export function EventPreviewCard({ event }: { event: WebEvent }) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-border-soft bg-surface">
      <div className="relative aspect-video w-full bg-surface">
        <RemoteImage key={event.imageUrl} src={event.imageUrl} alt={`โปสเตอร์ ${event.name}`} className="object-contain" sizes="(max-width: 767px) 90vw, 720px" />
      </div>
      <div className="space-y-2 p-4 tabletS:p-5">
        <p className="text-sm font-semibold leading-6 text-accent">{eventDayLabel(event.competitionStartDay)}{event.competitionEndDay && event.competitionEndDay !== event.competitionStartDay ? ` – ${eventDayLabel(event.competitionEndDay)}` : ""}</p>
        <h3 className="break-words text-lg font-semibold leading-7 text-foreground">{event.name}</h3>
        <p className="flex items-start gap-2 text-sm leading-6 text-muted"><FiMapPin aria-hidden className="mt-1 h-4 w-4 shrink-0" /><span className="break-words">{event.location || "รอประกาศสถานที่"}</span></p>
        <div className="pt-2"><Link href={eventEntryHref(event.id)} className={cn(buttonVariants({ variant: "gold-fill", size: "md", block: true }), "rounded-pill text-sm")} aria-label={`สมัครงาน ${event.name}`}>ดูรายละเอียดและสมัคร<FiArrowRight aria-hidden className="h-5 w-5 shrink-0" /></Link></div>
      </div>
    </article>
  );
}
