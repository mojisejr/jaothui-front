/** Local identity may be cleared only after durable server revocation succeeds. */
export async function logoutAndClear(clearLocal: () => void, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetcher("/api/auth/logout", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => null);
    if (payload?.success !== true) return false;
    clearLocal();
    return true;
  } catch { return false; }
}
