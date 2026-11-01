import { createClient, type SanityClient } from "@sanity/client";
import { EventError } from "./errors";

export function eventConfig(env: NodeJS.ProcessEnv = process.env, write = false) {
  if (typeof window !== "undefined") throw new Error("Event credentials are server-only");
  if (env.JAOTHUI_MOBILE_EVENTS_ENABLED !== "true") throw new EventError(503, "EVENTS_UNAVAILABLE", "ระบบกิจกรรมยังไม่พร้อมใช้งาน");
  const projectId = env.JAOTHUI_EVENT_SANITY_PROJECT_ID;
  const dataset = env.JAOTHUI_EVENT_SANITY_DATASET;
  if (!projectId || !/^[a-z0-9]+$/.test(projectId) || !dataset || !/^[a-zA-Z0-9_-]+$/.test(dataset)) throw new EventError(503, "EVENTS_UNAVAILABLE", "ระบบกิจกรรมยังไม่พร้อมใช้งาน");
  if (!env.JAOTHUI_EVENT_SANITY_WRITE_TOKEN) throw new EventError(503, write ? "EVENT_WRITE_NOT_CONFIGURED" : "EVENTS_UNAVAILABLE", "ระบบกิจกรรมยังไม่พร้อมใช้งาน");
  if (write && env.JAOTHUI_MOBILE_EVENT_WRITES_ENABLED !== "true") throw new EventError(503, "EVENT_WRITE_NOT_CONFIGURED", "ระบบสมัครยังไม่พร้อมใช้งาน");
  // Source deterministic IDs contain dots, so even guest-facing curated reads
  // need server auth upstream. Tokenless queries silently omit those documents.
  return { projectId, dataset, apiVersion: "2024-06-17", perspective: "published" as const, useCdn: false,
    token: env.JAOTHUI_EVENT_SANITY_WRITE_TOKEN };
}
export function createEventClient(write = false, env: NodeJS.ProcessEnv = process.env): SanityClient {
  return createClient(eventConfig(env, write));
}
export const PRODUCTION_LINE_CHANNEL = "2003013735";
// Authenticated Console + deployed LIFF proof, recorded 2026-10-28 in HQ.
export function assertEventIdentityNamespace(env: NodeJS.ProcessEnv = process.env) {
  if (env.JAOTHUI_LINE_LOGIN_CHANNEL_ID !== PRODUCTION_LINE_CHANNEL) throw new EventError(503, "IDENTITY_MAPPING_UNVERIFIED", "การเชื่อมโยงสมาชิกยังไม่พร้อมใช้งาน");
}
