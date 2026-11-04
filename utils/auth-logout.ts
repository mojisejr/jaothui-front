/** Local identity may be cleared only after durable server revocation succeeds. */
import { clearWebPushLogout, prepareWebPushLogout } from "./web-push";
export async function logoutAndClear(clearLocal: () => void, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const binding = prepareWebPushLogout();
    const body = binding ? JSON.stringify({ pushRevocation: { installationId: binding.installationId, revocationToken: binding.revocationToken } }) : "{}";
    const response = await fetcher("/api/auth/logout", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => null);
    if (payload?.success !== true) return false;
    try { clearWebPushLogout(binding, payload.pushRevocationProcessed === true); } catch { /* Keep narrow retry proof if local storage is unavailable. */ }
    clearLocal();
    return true;
  } catch { return false; }
}
