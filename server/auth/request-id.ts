import { randomUUID } from "crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requestIds = new WeakMap<object, string>();

// Do not echo arbitrary caller headers: they may contain tokens, URLs or newlines.
export function safeAuthRequestId(value: unknown) {
  return typeof value === "string" && UUID.test(value) ? value : randomUUID();
}

export function getAuthRequestId(req: { headers: Record<string, unknown> }) {
  const previous = requestIds.get(req);
  if (previous) return previous;
  const id = safeAuthRequestId(req.headers["x-request-id"]);
  requestIds.set(req, id);
  return id;
}
