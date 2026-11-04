import { createHash } from "crypto";
import { z } from "zod";

export const EXPO_PROJECT_ID = "41406db1-3e4f-4663-b7d9-f71f83e2f32d";
export const installationId = z.string().uuid();
const subscription = z
  .object({
    endpoint: z.string().max(2048),
    expirationTime: z.number().nullable().optional(),
    keys: z
      .object({
        p256dh: z.string().min(80).max(200),
        auth: z.string().min(20).max(100),
      })
      .strict(),
  })
  .strict();
export const installationInput = z.discriminatedUnion("platform", [
  z
    .object({ installationId, platform: z.literal("web"), subscription })
    .strict(),
  z
    .object({
      installationId,
      platform: z.enum(["android", "ios"]),
      expoPushToken: z
        .string()
        .regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/),
    })
    .strict(),
]);
export type InstallationInput = z.infer<typeof installationInput>;
export class PushError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function webPushDestination(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PushError(400, "INVALID_SUBSCRIPTION");
  }
  // These are provider endpoints, never arbitrary caller-supplied webhooks.
  const allowed = [
    "fcm.googleapis.com",
    "updates.push.services.mozilla.com",
    "web.push.apple.com",
  ];
  if (
    url.protocol !== "https:" ||
    (url.port && url.port !== "443") ||
    url.username ||
    url.password ||
    url.hash ||
    (!allowed.includes(url.hostname) &&
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:push\.apple\.com|notify\.windows\.com)$/.test(
        url.hostname,
      ))
  )
    throw new PushError(400, "INVALID_SUBSCRIPTION");
  return url.href;
}
export function targetFor(input: InstallationInput) {
  if (input.platform !== "web")
    return { type: "expo" as const, token: input.expoPushToken };
  const endpoint = webPushDestination(input.subscription.endpoint);
  for (const key of [
    input.subscription.keys.p256dh,
    input.subscription.keys.auth,
  ])
    if (!/^[A-Za-z0-9_-]+={0,2}$/.test(key))
      throw new PushError(400, "INVALID_SUBSCRIPTION");
  if (
    Buffer.from(input.subscription.keys.p256dh, "base64url").length !== 65 ||
    Buffer.from(input.subscription.keys.auth, "base64url").length !== 16
  )
    throw new PushError(400, "INVALID_SUBSCRIPTION");
  return { type: "web" as const, ...input.subscription, endpoint };
}
export function targetHash(target: ReturnType<typeof targetFor>) {
  return digest(target.type === "expo" ? target.token : target.endpoint);
}

export type RunReport = {
  mode: string;
  sourceRequests: number;
  scanned: number;
  endpoints: number;
  attempts: number;
  receipts: number;
  elapsedMs: number;
  stop: string;
  dryRun: boolean;
  pending: number;
  queueLagSeconds: number;
};
