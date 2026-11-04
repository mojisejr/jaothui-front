import { createClient } from "@sanity/client";
import { EXPO_PROJECT_ID, PushError } from "./contracts";
import { assertEventIdentityNamespace } from "../mobile/events/config";

export function pushConfig(env: NodeJS.ProcessEnv = process.env) {
  const integer = (key: string, fallback: number, maximum: number) => {
    const n = Number(env[key]);
    return Number.isSafeInteger(n) && n > 0 ? Math.min(n, maximum) : fallback;
  };
  const mode = ["dry-run", "pilot", "live"].includes(
    env.JAOTHUI_PUSH_MODE ?? "",
  )
    ? (env.JAOTHUI_PUSH_MODE as "dry-run" | "pilot" | "live")
    : "off";
  return {
    available: env.JAOTHUI_PUSH_REGISTRATION_ENABLED === "true",
    mode,
    expoProjectId: EXPO_PROJECT_ID,
    vapidPublicKey: env.JAOTHUI_WEB_PUSH_VAPID_PUBLIC_KEY || null,
    budgetMs: integer("JAOTHUI_PUSH_RUN_BUDGET_MS", 10000, 10000),
    maxPerRun: integer("JAOTHUI_PUSH_MAX_PER_RUN", 100, 100),
    dailySourceLimitConfigured:
      Number.isSafeInteger(
        Number(env.JAOTHUI_PUSH_DAILY_SOURCE_REQUEST_LIMIT),
      ) && Number(env.JAOTHUI_PUSH_DAILY_SOURCE_REQUEST_LIMIT) > 0,
    dailySourceLimit: integer(
      "JAOTHUI_PUSH_DAILY_SOURCE_REQUEST_LIMIT",
      10000,
      100000,
    ),
    dailyAttemptLimit: integer("JAOTHUI_PUSH_DAILY_ATTEMPT_LIMIT", 0, 1000000),
    pilotAccounts: (env.JAOTHUI_PUSH_PILOT_ACCOUNT_IDS ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    sendingAllowed:
      env.JAOTHUI_PUSH_SENDS_APPROVED === "true" &&
      env.VERCEL_ENV === "production",
  };
}
export function pushSource(env: NodeJS.ProcessEnv = process.env) {
  assertEventIdentityNamespace(env);
  const projectId = env.JAOTHUI_EVENT_SANITY_PROJECT_ID,
    dataset = env.JAOTHUI_EVENT_SANITY_DATASET;
  const token =
    env.JAOTHUI_EVENT_SANITY_READ_TOKEN || env.JAOTHUI_EVENT_SANITY_WRITE_TOKEN;
  if (
    !projectId ||
    !/^[a-z0-9]+$/.test(projectId) ||
    !dataset ||
    !/^[A-Za-z0-9_-]+$/.test(dataset) ||
    !token
  )
    throw new PushError(503, "SOURCE_NOT_CONFIGURED");
  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: "2024-06-17",
    perspective: "published",
    useCdn: false,
    timeout: 2000,
  });
}
