import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell } from "react-icons/fi";
import { Button } from "./Button";
import { SettingsRow } from "./SettingsRow";
import { disableStoredWebPush, disableWebPush, enableWebPush, flushWebPushRevocations, loadWebPushState, pushApi, storedWebPushBinding, type PushConfig, type PushState } from "../../utils/web-push";

const labels: Record<PushState, string> = {
  idle: "ยังไม่เปิด", enabled: "เปิดแล้ว", blocked: "ถูกบล็อกในการตั้งค่า",
  unsupported: "เบราว์เซอร์นี้ยังไม่รองรับ", "install-required": "เพิ่มลงหน้าจอโฮมก่อน", error: "ตรวจสอบไม่สำเร็จ",
};

/** Per-installation consent; permission and server binding must both succeed. */
export function CompetitionNotifications({ accountKey }: { accountKey: string }) {
  const [config, setConfig] = useState<PushConfig>();
  const [state, setState] = useState<PushState>("idle");
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasBinding, setHasBinding] = useState(false);
  const generation = useRef(0);
  const accountGeneration = useRef(0);
  const changing = useRef(false);
  const invalidate = useCallback(() => { generation.current++; accountGeneration.current++; }, []);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const next = await pushApi<PushConfig>("/api/notifications/config");
      if (current !== generation.current) return;
      setConfig(next);
      await flushWebPushRevocations();
      if (current !== generation.current) return;
      setHasBinding(Boolean(storedWebPushBinding()));
      if (next.available) {
        const status = await loadWebPushState();
        if (current === generation.current) { setState(status); setHasBinding(Boolean(storedWebPushBinding())); }
      }
    } catch {
      if (current === generation.current) { setConfig({ available: false, vapidPublicKey: null }); setHasBinding(Boolean(storedWebPushBinding())); setState("error"); setError("ตรวจสอบการแจ้งเตือนไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    }
  }, []);
  useEffect(() => {
    invalidate(); changing.current = false;
    setConfig(undefined); setError(""); setBusy(false);
    void refresh();
    const visible = () => { if (!changing.current && document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => { invalidate(); window.removeEventListener("focus", visible); document.removeEventListener("visibilitychange", visible); };
  }, [accountKey, refresh, invalidate]);
  if (!config || (!config.available && !hasBinding)) return null;
  const change = async () => {
    const current = accountGeneration.current;
    changing.current = true; setBusy(true); setError("");
    try {
      if (!config.available) {
        const confirmed = await disableStoredWebPush(() => current === accountGeneration.current);
        if (current === accountGeneration.current) {
          setHasBinding(Boolean(storedWebPushBinding()));
          if (!confirmed) setError("รอยืนยันการปิดเมื่อเชื่อมต่ออินเทอร์เน็ต กรุณาลองอีกครั้ง");
        }
      } else if (state === "enabled") {
        await disableWebPush(() => current === accountGeneration.current);
        if (current === accountGeneration.current) setState("idle");
      } else if (config.vapidPublicKey) {
        const status = await enableWebPush(config.vapidPublicKey, () => current === accountGeneration.current);
        if (current === accountGeneration.current) { setState(status); setHasBinding(Boolean(storedWebPushBinding())); }
      } else throw new Error("ระบบแจ้งเตือนยังไม่พร้อม กรุณาลองใหม่ภายหลัง");
    } catch (failure) {
      if (current === accountGeneration.current) setError(failure instanceof Error ? failure.message : "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally { if (current === accountGeneration.current) { changing.current = false; setBusy(false); } }
  };
  const disableExisting = async () => {
    const current = accountGeneration.current; changing.current = true; setBusy(true); setError("");
    const confirmed = await disableStoredWebPush(() => current === accountGeneration.current);
    if (current === accountGeneration.current) { changing.current = false; setHasBinding(Boolean(storedWebPushBinding())); setBusy(false); if (!confirmed) setError("รอยืนยันการปิดเมื่อเชื่อมต่ออินเทอร์เน็ต กรุณาลองอีกครั้ง"); }
  };
  return <section aria-label="การแจ้งเตือนการแข่งขัน" className="overflow-hidden rounded-card border border-border-soft bg-surface">
    <SettingsRow icon={<FiBell className="h-5 w-5" />} label="การแจ้งเตือนการแข่งขัน" onClick={() => setExpanded(value => !value)} right={<span className={config.available && state === "enabled" ? "text-sm text-success" : "text-sm text-muted"}>{config.available ? labels[state] : "พักการเปิดรับชั่วคราว"}</span>} />
    {expanded && <div className="space-y-3 border-t border-border-soft px-4 py-4">
      <p className="font-medium text-foreground">แจ้งเตือนบนอุปกรณ์นี้</p>
      <p className="text-sm leading-relaxed text-muted">เตือนงานที่คุณสมัครและเข้าเกณฑ์ ก่อนวันงาน 1 วัน เวลา 09:00 น. เปิดได้แยกกันบนแต่ละอุปกรณ์</p>
      {!config.available ? <><p className="text-sm text-muted">ระบบพักการเปิดรับใหม่ คุณยังปิดการรับแจ้งเตือนเดิมบนอุปกรณ์นี้ได้</p><Button type="button" variant="gold-outline" loading={busy} onClick={() => void change()}>ปิดบนอุปกรณ์นี้</Button></> : state === "install-required" ? <p className="text-sm text-muted">บน iPhone หรือ iPad ให้เปิดเว็บไซต์นี้ด้วย Safari เลือกแชร์ → เพิ่มไปยังหน้าจอโฮม แล้วเปิดจากไอคอนเพื่ออนุญาตการแจ้งเตือน</p>
        : state === "blocked" ? <p className="text-sm text-muted">อนุญาตการแจ้งเตือนให้เว็บไซต์นี้ในการตั้งค่าเบราว์เซอร์ แล้วกลับมาเปิดอีกครั้ง</p>
        : state === "unsupported" ? <p className="text-sm text-muted">เปิด https://www.jaothui.com ด้วยเบราว์เซอร์ที่รองรับ แทนหน้าต่างภายใน LINE หรือใช้แอปเจ้าทุย</p>
        : <Button type="button" variant={state === "enabled" ? "gold-outline" : "gold-fill"} loading={busy} onClick={() => void change()}>{state === "enabled" ? "ปิดบนอุปกรณ์นี้" : "เปิดการแจ้งเตือน"}</Button>}
      {config.available && hasBinding && ["blocked", "unsupported", "install-required"].includes(state) && <Button type="button" variant="gold-outline" loading={busy} onClick={() => void disableExisting()}>ปิดการรับแจ้งเตือนเดิมบนอุปกรณ์นี้</Button>}
      {error && <p role="alert" className="text-sm text-foreground">{error}</p>}
    </div>}
  </section>;
}
