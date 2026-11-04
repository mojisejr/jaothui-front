import { Expo } from "expo-server-sdk";
import webpush from "web-push";
import type {
  NotificationDelivery,
  NotificationInstallation,
} from "@prisma/client";
import { PushError, targetFor, webPushDestination } from "./contracts";
export type Outcome = {
  status:
    | "submitted"
    | "accepted"
    | "retry"
    | "invalid"
    | "credentials"
    | "unknown";
  ticketId?: string;
};
export function payload(row: NotificationDelivery) {
  return {
    title: "เตือนงานประกวด JAOTHUI",
    body: `${row.eventTitle.slice(0, 140)} · วันที่ ${row.startDay} ดูใบสมัครของคุณ`,
    data: {
      kind: "competition-reminder",
      eventId: row.eventId,
      expiresAt: row.expiresAt.toISOString(),
      reminderId: row.id,
    },
  };
}
export class PushTransports {
  // Expo SDK v8 accepts an undici dispatcher, which enforces request timeouts.
  constructor(
    private env: NodeJS.ProcessEnv = process.env,
    private fetcher: typeof fetch = fetch,
  ) {}
  private async expoRequest(path: string, body: unknown) {
    const response = await this.fetcher(
      `https://exp.host/--/api/v2/push/${path}`,
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(2000),
        headers: {
          "Content-Type": "application/json",
          ...(this.env.JAOTHUI_EXPO_ACCESS_TOKEN
            ? { Authorization: `Bearer ${this.env.JAOTHUI_EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(body),
      },
    );
    if (response.status === 401 || response.status === 403)
      throw new PushError(503, "PROVIDER_CREDENTIALS_INVALID");
    if (!response.ok)
      throw new PushError(
        response.status,
        response.status === 429 || response.status >= 500
          ? "PROVIDER_TRANSIENT"
          : "PROVIDER_REJECTED",
      );
    return response.json();
  }
  async send(
    installation: NotificationInstallation,
    row: NotificationDelivery,
    now: Date,
  ): Promise<Outcome> {
    const ttl = Math.floor((row.expiresAt.getTime() - now.getTime()) / 1000);
    if (ttl <= 0) return { status: "invalid" };
    const target = installation.target as ReturnType<typeof targetFor>;
    if (target.type === "expo") {
      if (!Expo.isExpoPushToken(target.token)) return { status: "invalid" };
      try {
        // SDK validates provider token/chunk format; HTTP is explicit to bound
        // elapsed time and avoid hidden SDK retry loops beyond the worker lease.
        const chunk = new Expo().chunkPushNotifications([
          {
            ...payload(row),
            to: target.token,
            ttl,
            expiration: Math.floor(row.expiresAt.getTime() / 1000),
            channelId: "competition-reminders",
            sound: "default",
          },
        ])[0];
        const body = await this.expoRequest("send", chunk);
        const ticket = body.data?.[0];
        if (ticket?.status === "ok" && typeof ticket.id === "string")
          return { status: "submitted", ticketId: ticket.id };
        return {
          status:
            ticket?.details?.error === "DeviceNotRegistered"
              ? "invalid"
              : ["InvalidCredentials", "MismatchSenderId"].includes(
                    ticket?.details?.error,
                  )
                ? "credentials"
                : "retry",
        };
      } catch (error) {
        return {
          status:
            error instanceof PushError
              ? error.code === "PROVIDER_CREDENTIALS_INVALID"
                ? "credentials"
                : error.code === "PROVIDER_TRANSIENT"
                  ? "retry"
                  : "invalid"
              : "unknown",
        };
      }
    }
    try {
      if (
        !this.env.JAOTHUI_WEB_PUSH_VAPID_PRIVATE_KEY ||
        !this.env.JAOTHUI_WEB_PUSH_VAPID_PUBLIC_KEY ||
        !this.env.JAOTHUI_WEB_PUSH_VAPID_SUBJECT
      )
        return { status: "credentials" };
      webPushDestination(target.endpoint);
      await webpush.sendNotification(target, JSON.stringify(payload(row)), {
        TTL: ttl,
        timeout: 2000,
        urgency: "normal",
        topic: row.id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32),
        vapidDetails: {
          subject: this.env.JAOTHUI_WEB_PUSH_VAPID_SUBJECT,
          publicKey: this.env.JAOTHUI_WEB_PUSH_VAPID_PUBLIC_KEY,
          privateKey: this.env.JAOTHUI_WEB_PUSH_VAPID_PRIVATE_KEY,
        },
      });
      return { status: "accepted" };
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      return {
        status:
          status === 404 || status === 410
            ? "invalid"
            : status === 401 || status === 403
              ? "credentials"
              : status === 429 || (status && status >= 500)
                ? "retry"
                : "unknown",
      };
    }
  }
  async receipts(ids: string[]) {
    const result = await this.expoRequest("getReceipts", { ids });
    return result.data as Record<
      string,
      { status: string; details?: { error?: string } }
    >;
  }
}
