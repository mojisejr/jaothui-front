export const PUSH_INSTALLATION_KEY = "jaothui.push.installation.v1";
const REVOCATION_KEY = "jaothui.push.revocation.v1";
const INSTALLATION_COOKIE = "jaothui_push_installation";
const PENDING_REVOCATIONS_KEY = "jaothui.push.pending-revocations.v1";
type Revocation = { installationId: string; revocationToken: string; bindingGeneration: number };
export type PushConfig = { available: boolean; vapidPublicKey: string | null };
export type PushState = "idle" | "enabled" | "blocked" | "unsupported" | "install-required" | "error";

export function webPushCapability({ userAgent, standalone, secure, supported, permission }: {
  userAgent: string; standalone: boolean; secure: boolean; supported: boolean; permission: string;
}): PushState {
  if (!secure || /Line\//i.test(userAgent)) return "unsupported";
  const ios = /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && /Mobile\//.test(userAgent));
  if (ios && !standalone) return "install-required";
  if (!supported) return "unsupported";
  if (permission === "denied") return "blocked";
  return "idle";
}

export function browserPushCapability(): PushState {
  return webPushCapability({
    userAgent: navigator.userAgent,
    standalone: window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    secure: window.isSecureContext && window.location.origin === "https://www.jaothui.com",
    supported: "serviceWorker" in navigator && "PushManager" in window && "Notification" in window,
    permission: "Notification" in window ? Notification.permission : "default",
  });
}

export function pushInstallationId() {
  let id = localStorage.getItem(PUSH_INSTALLATION_KEY);
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    id = crypto.randomUUID();
    localStorage.setItem(PUSH_INSTALLATION_KEY, id);
  }
  document.cookie = `${INSTALLATION_COOKIE}=${encodeURIComponent(id)}; Path=/; SameSite=Lax; Secure; Max-Age=31536000`;
  return id;
}

export async function pushApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init, credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Jaothui-CSRF": "1", ...init?.headers },
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) throw new Error("บันทึกการแจ้งเตือนไม่สำเร็จ กรุณาลองอีกครั้ง");
  return result.data as T;
}

export async function loadWebPushState(): Promise<PushState> {
  const capability = browserPushCapability();
  if (capability !== "idle") return capability;
  const id = pushInstallationId();
  const status = await pushApi<{ enabled: boolean; bindingGeneration: number | null }>(`/api/notifications/installation?${new URLSearchParams({ installationId: id })}`);
  if (!status.enabled || Notification.permission !== "granted") return "idle";
  let saved: Revocation | null = null;
  try { saved = JSON.parse(localStorage.getItem(REVOCATION_KEY) ?? "null"); } catch { /* Explicit re-enable repairs an incomplete binding. */ }
  if (saved?.installationId !== id || saved.bindingGeneration !== status.bindingGeneration) return "idle";
  const registration = await navigator.serviceWorker.getRegistration("/");
  return registration && await registration.pushManager.getSubscription() ? "enabled" : "idle";
}

async function revokeBinding(binding: Revocation) {
  try {
    await pushApi("/api/notifications/revoke", { method: "POST", body: JSON.stringify({ installationId: binding.installationId, revocationToken: binding.revocationToken }) });
    return true;
  } catch {
    // A disable-only capability can be retried without retaining an account session.
    queueWebPushRevocation(binding);
    return false;
  }
}

function queueWebPushRevocation(binding: Revocation) {
  try {
    const old: unknown = JSON.parse(localStorage.getItem(PENDING_REVOCATIONS_KEY) ?? "[]");
    if (!Array.isArray(old)) return;
    localStorage.setItem(PENDING_REVOCATIONS_KEY, JSON.stringify([...old.filter(item => item?.revocationToken !== binding.revocationToken), binding]));
  } catch { /* Keep the original binding capability when a retry queue cannot be stored. */ }
}

export async function flushWebPushRevocations() {
  let pending: Revocation[];
  try { pending = JSON.parse(localStorage.getItem(PENDING_REVOCATIONS_KEY) ?? "[]"); } catch { return; }
  if (!Array.isArray(pending) || !pending.length) return;
  localStorage.setItem(PENDING_REVOCATIONS_KEY, JSON.stringify(pending.slice(10)));
  for (const binding of pending.slice(0, 10)) {
    if (typeof binding?.installationId === "string" && typeof binding.revocationToken === "string") {
      const confirmed = await revokeBinding(binding);
      if (confirmed && storedWebPushBinding()?.revocationToken === binding.revocationToken) localStorage.removeItem(REVOCATION_KEY);
    }
  }
}

export function storedWebPushBinding(): Revocation | null {
  try {
    const value = JSON.parse(localStorage.getItem(REVOCATION_KEY) ?? "null");
    return typeof value?.installationId === "string" && typeof value.revocationToken === "string" && Number.isSafeInteger(value.bindingGeneration) ? value : null;
  } catch { return null; }
}

/** Available even when new subscriptions are paused; cannot disable another generation. */
export async function disableStoredWebPush(isCurrent: () => boolean = () => true) {
  const binding = storedWebPushBinding();
  if (!binding || !isCurrent()) return true;
  const confirmed = await revokeBinding(binding);
  if (confirmed && isCurrent() && storedWebPushBinding()?.revocationToken === binding.revocationToken) localStorage.removeItem(REVOCATION_KEY);
  return confirmed;
}

export function applicationServerKey(value: string) {
  if (!/^[A-Za-z0-9_-]{80,128}$/.test(value)) throw new Error("ระบบแจ้งเตือนยังไม่พร้อม");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const raw = atob(padded);
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

/** Called from a direct user click; the OS prompt precedes any async network boundary. */
export async function enableWebPush(vapidPublicKey: string, isCurrent: () => boolean = () => true): Promise<PushState> {
  const capability = browserPushCapability();
  if (capability !== "idle") return capability;
  const permission = await Notification.requestPermission();
  if (!isCurrent()) throw new Error("บัญชีเปลี่ยนแล้ว กรุณาเปิดการแจ้งเตือนใหม่");
  if (permission !== "granted") return permission === "denied" ? "blocked" : "idle";
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active && new URL(existing.active.scriptURL).pathname !== "/jaothui-push-sw.js") throw new Error("ระบบแจ้งเตือนยังไม่พร้อมบนเบราว์เซอร์นี้");
  const registration = await navigator.serviceWorker.register("/jaothui-push-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
    userVisibleOnly: true, applicationServerKey: applicationServerKey(vapidPublicKey),
  });
  const installationId = pushInstallationId();
  if (!isCurrent()) throw new Error("บัญชีเปลี่ยนแล้ว กรุณาเปิดการแจ้งเตือนใหม่");
  const result = await pushApi<{ enabled: boolean; bindingGeneration: number; revocationToken: string }>("/api/notifications/installation", {
    method: "PUT", body: JSON.stringify({ installationId, platform: "web", subscription: subscription.toJSON() }),
  });
  if (!result.enabled || typeof result.revocationToken !== "string" || !Number.isSafeInteger(result.bindingGeneration)) throw new Error("บันทึกการแจ้งเตือนไม่สำเร็จ");
  const binding = { installationId, revocationToken: result.revocationToken, bindingGeneration: result.bindingGeneration };
  if (!isCurrent()) {
    await revokeBinding(binding);
    throw new Error("บัญชีเปลี่ยนแล้ว กรุณาเปิดการแจ้งเตือนใหม่");
  }
  try { localStorage.setItem(REVOCATION_KEY, JSON.stringify(binding)); }
  catch {
    await revokeBinding(binding);
    throw new Error("บันทึกการแจ้งเตือนบนอุปกรณ์นี้ไม่สำเร็จ");
  }
  return "enabled";
}

export async function disableWebPush(isCurrent: () => boolean = () => true) {
  if (!isCurrent()) return;
  const installationId = pushInstallationId();
  await pushApi("/api/notifications/installation", { method: "DELETE", body: JSON.stringify({ installationId }) });
  if (!isCurrent()) return;
  localStorage.removeItem(REVOCATION_KEY);
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/");
    try { await (await registration?.pushManager.getSubscription())?.unsubscribe(); } catch { /* Durable server opt-out succeeded. */ }
  }
}

/** Persist disable-only proof before logout can clear expired account credentials/cookies. */
export function prepareWebPushLogout() {
  const binding = storedWebPushBinding();
  if (binding) queueWebPushRevocation(binding);
  return binding;
}

/** Clear only the exact generation acknowledged by the server, never a newer account binding. */
export function clearWebPushLogout(binding: Revocation | null, processed: boolean) {
  if (!binding || !processed) return;
  if (storedWebPushBinding()?.revocationToken === binding.revocationToken) localStorage.removeItem(REVOCATION_KEY);
  try {
    const pending: unknown = JSON.parse(localStorage.getItem(PENDING_REVOCATIONS_KEY) ?? "[]");
    if (Array.isArray(pending)) localStorage.setItem(PENDING_REVOCATIONS_KEY, JSON.stringify(pending.filter(item => item?.revocationToken !== binding.revocationToken)));
  } catch { /* A stale narrow handle is safe to retry; do not erase unknown queued work. */ }
}
