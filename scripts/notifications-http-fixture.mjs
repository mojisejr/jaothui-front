import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  installationHandler,
  revokeCurrentWebInstallation,
} from "../server/notifications/http.ts";
import { createMobileAccountSession } from "../server/mobile/auth-session.ts";
import { createLineWebSession } from "../server/auth/line-web-session.ts";
import { registerInstallation } from "../server/notifications/installations.ts";
import { softDeleteAccount } from "../server/services/account.service.ts";
const raw = process.env.NOTIFICATION_TEST_DATABASE_URL;
if (!raw) throw Error("Explicit isolated fixture URL required");
const u = new URL(raw);
if (
  u.hostname !== "127.0.0.1" ||
  u.port !== "55439" ||
  u.pathname !== "/jaothui_push_fixture" ||
  u.username !== "fixture" ||
  process.env.DATABASE_URL !== raw
)
  throw Error("Refusing non-isolated database");
process.env.JAOTHUI_MOBILE_AUTH_SECRET =
  "notification-fixture-mobile-signing-secret-only";
process.env.JAOTHUI_WEB_AUTH_SECRET =
  "notification-fixture-web-signing-secret-only";
const db = new PrismaClient({ datasources: { db: { url: raw } }, log: [] });
function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    getHeader(k) {
      return this.headers[k];
    },
    status(n) {
      this.statusCode = n;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
const req = (method, more = {}) => ({
  method,
  headers: {},
  query: {},
  body: {},
  ...more,
});
let checks = 0;
const check = async (n, f) => {
  await f();
  checks++;
  console.log(`PASS ${n}`);
};
const actor = "notification-http-fixture",
  victim = "notification-http-other",
  id = "00000000-0000-4000-8000-000000000900";
try {
  for (const aid of [actor, victim])
    await db.account.upsert({
      where: { id: aid },
      create: { id: aid },
      update: { status: "ACTIVE", deletedAt: null },
    });
  await db.notificationDelivery.deleteMany({
    where: { accountId: { in: [actor, victim] } },
  });
  await db.notificationInstallation.deleteMany({
    where: { accountId: { in: [actor, victim] } },
  });
  const token = createMobileAccountSession({
    accountId: actor,
    primaryProvider: "line",
    providerUserId: "line-http-fixture",
  }).token;
  const headers = { authorization: `Bearer ${token}` };
  await check(
    "feature OFF GET is unavailable without DB/auth requirement",
    async () => {
      delete process.env.JAOTHUI_PUSH_REGISTRATION_ENABLED;
      const res = response();
      await installationHandler(true)(req("GET"), res);
      assert.equal(res.body.data.available, false);
      assert.equal(res.body.data.bindingGeneration, null);
    },
  );
  process.env.JAOTHUI_PUSH_REGISTRATION_ENABLED = "true";
  await check("native anonymous and malformed session rejected", async () => {
    for (const h of [{}, { authorization: "Bearer not-a-session" }]) {
      const res = response();
      await installationHandler(true)(
        req("GET", { headers: h, query: { installationId: id } }),
        res,
      );
      assert.equal(res.statusCode, 401);
    }
  });
  await check(
    "reviewer JWT excluded even if account role looks ordinary",
    async () => {
      const reviewer = createMobileAccountSession({
        accountId: actor,
        primaryProvider: "reviewer",
        providerUserId: "fixture-reviewer",
      }).token;
      const res = response();
      await installationHandler(true)(
        req("GET", {
          headers: { authorization: `Bearer ${reviewer}` },
          query: { installationId: id },
        }),
        res,
      );
      assert.equal(res.statusCode, 403);
    },
  );
  await registerInstallation(db, victim, {
    installationId: id,
    platform: "ios",
    expoPushToken: "ExpoPushToken[httpfixturetarget]",
  });
  await check(
    "GET cannot reveal another owner binding generation",
    async () => {
      const res = response();
      await installationHandler(true)(
        req("GET", { headers, query: { installationId: id } }),
        res,
      );
      assert.deepEqual(res.body.data, {
        available: true,
        enabled: false,
        bindingGeneration: null,
      });
    },
  );
  await check(
    "native cannot register web target or caller accountId",
    async () => {
      for (const body of [
        { installationId: id, platform: "web" },
        {
          installationId: id,
          platform: "ios",
          expoPushToken: "ExpoPushToken[httpfixturetarget]",
          accountId: victim,
        },
      ]) {
        const res = response();
        await installationHandler(true)(req("PUT", { headers, body }), res);
        assert.equal(res.statusCode, 400);
      }
    },
  );
  await check(
    "web cookie mutation requires same-origin independent of SSO flag",
    async () => {
      process.env.JAOTHUI_EVENT_SSO_ENABLED = "false";
      const res = response();
      await installationHandler(false)(
        req("PUT", { body: { installationId: id, platform: "web" } }),
        res,
      );
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.error.code, "CSRF_REJECTED");
    },
  );
  await check(
    "expired login can revoke with narrow proof and still clear logout cookies",
    async () => {
      const expiryId = "00000000-0000-4000-8000-000000000901";
      const proof = await registerInstallation(db, actor, {
        installationId: expiryId,
        platform: "android",
        expoPushToken: "ExpoPushToken[expiredfixturetarget]",
      });
      const res = response();
      await revokeCurrentWebInstallation(
        req("POST", {
          headers: {
            origin: "https://www.jaothui.com",
            cookie: `jaothui_push_installation=${expiryId}; jaothui_line_session=expired.invalid`,
          },
          body: {
            pushRevocation: {
              installationId: expiryId,
              revocationToken: proof.revocationToken,
            },
          },
        }),
        res,
      );
      assert.equal(
        (
          await db.notificationInstallation.findUnique({
            where: { id: expiryId },
          })
        ).enabled,
        false,
      );
      await revokeCurrentWebInstallation(
        req("POST", {
          headers: {
            origin: "https://www.jaothui.com",
            cookie: `jaothui_push_installation=${expiryId}; jaothui_line_session=expired.invalid`,
          },
        }),
        response(),
      );
    },
  );
  await check(
    "account deletion atomically disables all installations",
    async () => {
      await softDeleteAccount(victim);
      const rows = await db.notificationInstallation.findMany({
        where: { accountId: victim },
      });
      assert(rows.length);
      assert(rows.every((r) => !r.enabled));
    },
  );
  await db.accountIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider: "line",
        providerUserId: "line-http-fixture",
      },
    },
    create: {
      accountId: actor,
      provider: "line",
      providerUserId: "line-http-fixture",
    },
    update: { accountId: actor },
  });
  const session = createLineWebSession({
    accountId: actor,
    lineUserId: "line-http-fixture",
  }).token;
  await check(
    "pre-migration logout and deletion stay compatible when notification table absent",
    async () => {
      await db.$executeRawUnsafe(
        'ALTER TABLE "NotificationInstallation" RENAME TO "NotificationInstallationFixtureAbsent"',
      );
      try {
        const res = response();
        await revokeCurrentWebInstallation(
          req("POST", {
            headers: {
              origin: "https://www.jaothui.com",
              cookie: `jaothui_push_installation=${id}; jaothui_line_session=${session}`,
            },
          }),
          res,
        );
        await softDeleteAccount(actor);
        assert.equal(
          (await db.account.findUnique({ where: { id: actor } })).status,
          "DELETED",
        );
      } finally {
        await db.$executeRawUnsafe(
          'ALTER TABLE "NotificationInstallationFixtureAbsent" RENAME TO "NotificationInstallation"',
        );
      }
    },
  );
  console.log(
    `${checks} isolated HTTP/auth/deletion compatibility checks passed.`,
  );
} finally {
  await db.$disconnect();
}
