export const NOTIFICATION_SETTINGS_ID = "competition-notifications";
const KEY = "jaothui.push.settings-intent.v1";
const TTL_MS = 10 * 60 * 1000;

/** A fixed panel reveal intent, not a permission grant or an arbitrary login return URL. */
export function rememberNotificationSettingsIntent(now = Date.now()) {
  if (window.location.hash !== `#${NOTIFICATION_SETTINGS_ID}`) return;
  try { sessionStorage.setItem(KEY, String(now)); } catch { /* Current hash still works without storage. */ }
}

export function consumeNotificationSettingsIntent(now = Date.now()) {
  let stored: string | null = null;
  try { stored = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch { /* Fail quiet. */ }
  const at = Number(stored);
  return window.location.hash === `#${NOTIFICATION_SETTINGS_ID}` || (stored !== null && Number.isFinite(at) && at <= now && now - at < TTL_MS);
}
