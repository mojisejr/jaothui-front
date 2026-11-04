export type EventEntryIntent = "registration" | "history";
export const publishedEventId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(value) &&
  !value.includes("..") && !/^(drafts|versions|_)\./.test(value);

export function eventEntryIntent(value: unknown): EventEntryIntent {
  if (value === undefined || value === "registration") return "registration";
  if (value === "history") return "history";
  throw new Error("Invalid Event intent");
}

/** Reconstruct only the bounded local handoff, including after login or LINE attach. */
export function eventEntryParams(query: Record<string, string | string[] | undefined>) {
  if (!publishedEventId(query.eventId) || Object.keys(query).some(key =>
    !["eventId", "intent", "state", "code_challenge", "attach"].includes(key))) throw new Error("Invalid Event intent");
  const intent = eventEntryIntent(query.intent);
  const params = new URLSearchParams({ eventId: query.eventId });
  if (intent === "history") params.set("intent", intent);
  if (query.attach !== undefined && query.attach !== "line") throw new Error("Invalid attach intent");
  if (query.state !== undefined || query.code_challenge !== undefined) {
    if (typeof query.state !== "string" || !/^[A-Za-z0-9_-]{32,128}$/.test(query.state) ||
      typeof query.code_challenge !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(query.code_challenge)) throw new Error("Invalid authorization intent");
    params.set("state", query.state);
    params.set("code_challenge", query.code_challenge);
  }
  return params;
}
