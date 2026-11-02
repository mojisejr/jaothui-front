import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { SearchInput } from "./SearchInput";
import { EventPreviewCard } from "./EventPreviewCard";
import { fetchWebEvents, uniqueOpenEvents, validateEventDates, type WebEventPage } from "../../utils/web-events";

type Filters = { q: string; from: string; to: string };
const EMPTY: Filters = { q: "", from: "", to: "" };

export function EventList() {
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState<WebEventPage | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const request = useRef(0);
  const queryKey = JSON.stringify(filters);
  const acceptedQuery = useRef(queryKey);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    const version = ++request.current;
    setLoading(true); setError(false);
    fetchWebEvents({ ...filters, cursor, limit: 12 }, controller.signal).then(data => {
      if (controller.signal.aborted || request.current !== version) return;
      setPage(previous => ({ ...data, items: cursor && acceptedQuery.current === queryKey ? uniqueOpenEvents([...(previous?.items ?? []), ...data.items]) : data.items }));
      acceptedQuery.current = queryKey;
    }).catch(() => { if (!controller.signal.aborted && request.current === version) setError(true); }).finally(() => {
      if (!controller.signal.aborted && request.current === version) setLoading(false);
    });
    return () => controller.abort();
  }, [filters, queryKey, cursor, retry]);

  function search(event?: FormEvent) {
    event?.preventDefault();
    const invalid = validateEventDates(draft.from, draft.to);
    setValidation(invalid);
    if (invalid) return;
    controllerRef.current?.abort(); request.current++;
    setPage(null); setCursor(undefined); setFilters({ ...draft, q: draft.q.trim() });
    setRetry(value => value + 1);
  }
  function clear() {
    controllerRef.current?.abort(); request.current++;
    setDraft(EMPTY); setFilters(EMPTY); setValidation(null); setPage(null); setCursor(undefined); setRetry(value => value + 1);
  }

  return <div className="space-y-6">
    <form onSubmit={search} className="space-y-4" aria-label="ค้นหางานประกวด">
      <label className="block space-y-2 text-sm text-muted"><span>ชื่องานประกวด</span><SearchInput value={draft.q} maxLength={100} placeholder="ค้นหาชื่องานประกวด" onChange={event => { const q = event.target.value; setDraft(current => ({ ...current, q })); }} /></label>
      <div className="flex flex-wrap gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-muted">วันแข่งขันตั้งแต่ (ค.ศ.)<input type="date" value={draft.from} min="1900-01-01" max="2399-12-31" className="min-h-[48px] min-w-0 rounded-card border border-border-soft bg-surface px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" onChange={event => { const from = event.target.value; setDraft(current => ({ ...current, from })); }} /></label>
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-muted">ถึงวันที่ (ค.ศ.)<input type="date" value={draft.to} min="1900-01-01" max="2399-12-31" className="min-h-[48px] min-w-0 rounded-card border border-border-soft bg-surface px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" onChange={event => { const to = event.target.value; setDraft(current => ({ ...current, to })); }} /></label>
      </div>
      {validation ? <p role="alert" className="text-sm text-danger">{validation}</p> : null}
      <div className="flex flex-wrap gap-3"><Button type="submit">ค้นหา</Button><Button type="button" variant="gold-outline" onClick={clear}>ล้างตัวกรอง</Button></div>
    </form>
    {error ? <div role="status" className="space-y-3 text-sm text-muted"><p>โหลดงานประกวดไม่สำเร็จ กรุณาลองอีกครั้ง</p><Button variant="gold-outline" onClick={() => setRetry(value => value + 1)}>ลองใหม่</Button></div> : null}
    {loading ? <p role="status" className="text-sm text-muted">กำลังโหลดงานประกวด…</p> : null}
    {!page && loading ? <div aria-hidden className="aspect-video animate-pulse rounded-card bg-surface" /> : null}
    {page && page.items.length === 0 && !loading && !error ? <p className="py-8 text-center text-muted">ไม่พบงานประกวดที่เปิดรับสมัครตามตัวกรองนี้</p> : null}
    {page ? <div className="grid grid-cols-1 gap-5 tabletS:grid-cols-2">{page.items.map(event => <EventPreviewCard key={event.id} event={event} />)}</div> : null}
    {page?.nextCursor ? <Button variant="gold-outline" disabled={loading || error} onClick={() => setCursor(page.nextCursor ?? undefined)}>ดูงานเพิ่มเติม</Button> : null}
  </div>;
}
