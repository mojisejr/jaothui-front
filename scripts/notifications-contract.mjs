import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  reminderSlot,
  eligible,
  competitionDay,
} from "../server/notifications/policy.ts";
import { pushConfig } from "../server/notifications/config.ts";
import {
  installationInput,
  targetFor,
  webPushDestination,
  EXPO_PROJECT_ID,
} from "../server/notifications/contracts.ts";
import { payload, PushTransports } from "../server/notifications/transports.ts";
let checks = 0;
const check = async (name, fn) => {
  await fn();
  checks++;
  console.log(`PASS ${name}`);
};
const event = {
  _id: "competition-fixture",
  title: "งานประกวด",
  eventType: "normal",
  competitionState: "published",
  isActive: true,
  startAt: "2026-11-23",
};
await check("D-1 09:00 Bangkok and event midnight expiry", () => {
  const slot = reminderSlot(event);
  assert.equal(slot.dueAt.toISOString(), "2026-11-22T02:00:00.000Z");
  assert.equal(slot.expiresAt.toISOString(), "2026-11-22T17:00:00.000Z");
});
await check("normal registered irrespective of approval", () => {
  assert(eligible(event, null));
  assert(eligible(event, { approvementResult: false }));
});
await check("Royal accepted only, strict boolean", () => {
  for (const x of [null, false, undefined, "true", 1])
    assert.equal(
      eligible({ ...event, eventType: "royal" }, { approvementResult: x }),
      false,
    );
  assert(
    eligible({ ...event, eventType: "royal" }, { approvementResult: true }),
  );
});
await check("unknown never flattened to normal", () => {
  for (const x of [undefined, "Royal", "other", null]) {
    assert.equal(
      eligible({ ...event, eventType: x }, { approvementResult: true }),
      false,
    );
    assert.equal(reminderSlot({ ...event, eventType: x }), null);
  }
});
await check("signup closed is still eligible", () => {
  assert(
    reminderSlot({
      ...event,
      registrationActive: false,
      registrationDeadline: "2026-11-01",
    }),
  );
});
await check("closed/draft/inactive/deleted namespace suppressed", () => {
  for (const e of [
    { ...event, competitionState: "draft" },
    { ...event, competitionState: "closed" },
    { ...event, isActive: false },
    { ...event, _id: "drafts.fixture" },
    { ...event, _id: "versions.fixture" },
  ])
    assert.equal(reminderSlot(e), null);
});
await check("schedule ignores revision, title and poster", () => {
  assert.equal(
    reminderSlot(event).schedule,
    reminderSlot({
      ...event,
      _rev: "another",
      title: "changed",
      poster: "other",
    }).schedule,
  );
  assert.notEqual(
    reminderSlot(event).schedule,
    reminderSlot({ ...event, startAt: "2026-11-24" }).schedule,
  );
});
await check("valid legacy eventAt fallback and strict dates", () => {
  assert.equal(
    reminderSlot({
      ...event,
      startAt: undefined,
      eventAt: "2026-11-23T12:00:00Z",
    }).startDay,
    "2026-11-23",
  );
  for (const x of ["2026-02-30", "2026-11-23garbage", "x", null])
    assert.equal(competitionDay(x), null);
});
await check("missing flags never allow sender or optin", () => {
  assert.equal(pushConfig({}).mode, "off");
  assert.equal(pushConfig({}).available, false);
  assert.equal(pushConfig({}).sendingAllowed, false);
});
await check(
  "production approval and explicit daily budget required independently",
  () => {
    assert.equal(
      pushConfig({
        JAOTHUI_PUSH_MODE: "live",
        JAOTHUI_PUSH_SENDS_APPROVED: "true",
        VERCEL_ENV: "preview",
      }).sendingAllowed,
      false,
    );
    assert.equal(pushConfig({}).dailyAttemptLimit, 0);
    assert.equal(pushConfig({}).dailySourceLimitConfigured, false);
  },
);
await check("per-run ceilings bounded by deployed timeout", () => {
  const c = pushConfig({
    JAOTHUI_PUSH_RUN_BUDGET_MS: "999999",
    JAOTHUI_PUSH_MAX_PER_RUN: "99999",
  });
  assert.equal(c.budgetMs, 10000);
  assert.equal(c.maxPerRun, 100);
});
await check("provider HTTPS exact and label suffix allowlist", () => {
  for (const u of [
    "https://fcm.googleapis.com/a",
    "https://updates.push.services.mozilla.com/a",
    "https://web.push.apple.com/a",
    "https://a.b.push.apple.com/a",
    "https://wns2.notify.windows.com/a",
  ])
    assert.equal(webPushDestination(u), u);
});
await check("SSRF/insecure/credential/lookalike targets rejected", () => {
  for (const u of [
    "http://fcm.googleapis.com/a",
    "https://localhost/a",
    "https://127.0.0.1/a",
    "https://fcm.googleapis.com.evil.test/a",
    "https://evilpush.apple.com/a",
    "https://apple.com/a",
    "https://push.apple.com.evil/a",
    "https://fcm.googleapis.com:444/a",
    "https://u:p@fcm.googleapis.com/a",
    "https://fcm.googleapis.com/a#secret",
  ])
    assert.throws(() => webPushDestination(u));
});
const input = {
  installationId: "00000000-0000-4000-8000-000000000001",
  platform: "web",
  subscription: {
    endpoint: "https://fcm.googleapis.com/a",
    keys: {
      p256dh: Buffer.concat([Buffer.from([4]), Buffer.alloc(64)]).toString(
        "base64url",
      ),
      auth: Buffer.alloc(16).toString("base64url"),
    },
  },
};
await check(
  "subscription strict key lengths and caller account rejection",
  () => {
    assert(targetFor(installationInput.parse(input)));
    assert.equal(
      installationInput.safeParse({ ...input, accountId: "victim" }).success,
      false,
    );
    assert.throws(() =>
      targetFor({
        ...input,
        subscription: {
          ...input.subscription,
          keys: { ...input.subscription.keys, auth: "!".repeat(22) },
        },
      }),
    );
  },
);
await check("native schema and fixed project", () => {
  assert.equal(EXPO_PROJECT_ID, "41406db1-3e4f-4663-b7d9-f71f83e2f32d");
  assert(
    installationInput.safeParse({
      installationId: input.installationId,
      platform: "android",
      expoPushToken: "ExpoPushToken[abcdefghijklmn]",
    }).success,
  );
});
const row = {
  id: "synthetic-delivery",
  eventId: event._id,
  eventTitle: "ชื่อสาธารณะ",
  startDay: "2026-11-23",
  expiresAt: new Date("2026-11-22T17:00:00Z"),
  sourceLineId: "secret-member",
  accountId: "secret-account",
};
await check(
  "minimal lockscreen payload only fixed typed history intent",
  () => {
    const p = payload(row);
    assert.deepEqual(Object.keys(p.data).sort(), [
      "eventId",
      "expiresAt",
      "kind",
      "reminderId",
    ]);
    assert.equal(p.data.kind, "competition-reminder");
    assert(!JSON.stringify(p).includes("secret"));
  },
);
await check("expired payload never invokes provider", async () => {
  let calls = 0;
  const adapter = new PushTransports({}, async () => {
    calls++;
    throw Error("must not send");
  });
  assert.equal(
    (
      await adapter.send(
        { target: { type: "expo", token: "ExpoPushToken[abcdefghijklmn]" } },
        row,
        row.expiresAt,
      )
    ).status,
    "invalid",
  );
  assert.equal(calls, 0);
});
await check(
  "Expo channel, expiry and receipt captured with simulated HTTP",
  async () => {
    let sent;
    const adapter = new PushTransports({}, async (url, options) => {
      sent = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [{ status: "ok", id: "receipt-fixture" }] }),
      };
    });
    const out = await adapter.send(
      { target: { type: "expo", token: "ExpoPushToken[abcdefghijklmn]" } },
      row,
      new Date("2026-11-22T02:00:00Z"),
    );
    assert.equal(out.status, "submitted");
    assert.equal(sent[0].channelId, "competition-reminders");
    assert.equal(sent[0].ttl, 15 * 3600);
  },
);
await check(
  "provider timeout tracked unknown and permanent token failure",
  async () => {
    const adapter = new PushTransports({}, async () => {
      throw Error("timeout");
    });
    assert.equal(
      (
        await adapter.send(
          { target: { type: "expo", token: "ExpoPushToken[abcdefghijklmn]" } },
          row,
          new Date("2026-11-22T02:00:00Z"),
        )
      ).status,
      "unknown",
    );
    const invalid = new PushTransports({}, async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ status: "error", details: { error: "DeviceNotRegistered" } }],
      }),
    }));
    assert.equal(
      (
        await invalid.send(
          { target: { type: "expo", token: "ExpoPushToken[abcdefghijklmn]" } },
          row,
          new Date("2026-11-22T02:00:00Z"),
        )
      ).status,
      "invalid",
    );
  },
);
await check("no Cron activation file introduced", () => {
  try {
    const c = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
    );
    assert(!(c.crons ?? []).some((v) => v.path.includes("notifications")));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
});
console.log(
  `${checks} notification contract checks passed; all provider HTTP simulated.`,
);
