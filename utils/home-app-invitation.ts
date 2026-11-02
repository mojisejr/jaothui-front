export const HOME_INVITATION_KEY = "jaothui.home-app-invitation.v1.shown-at";
export const HOME_INVITATION_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const HOME_INVITATION_DELAY_MS = 2000;

export function isHomeInvitationDue(raw: string | null, now: number): boolean {
  if (!raw || !/^\d+$/.test(raw)) return true;
  const shownAt = Number(raw);
  if (!Number.isSafeInteger(shownAt) || shownAt <= 0) return true;
  // A clock moved backwards must not cause another unsolicited prompt.
  return now - shownAt >= HOME_INVITATION_INTERVAL_MS;
}

export function canShowHomeInvitation(storage: Pick<Storage, "getItem">, now: number): boolean {
  try { return isHomeInvitationDue(storage.getItem(HOME_INVITATION_KEY), now); }
  catch { return false; }
}

/** Called only after showModal succeeds. Failed persistence closes the prompt. */
export function rememberHomeInvitation(storage: Pick<Storage, "setItem" | "getItem">, now: number): boolean {
  try {
    const value = String(now);
    storage.setItem(HOME_INVITATION_KEY, value);
    return storage.getItem(HOME_INVITATION_KEY) === value;
  } catch { return false; }
}
