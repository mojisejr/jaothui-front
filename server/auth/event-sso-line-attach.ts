import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../prisma";
import { verifyAuthJwt } from "./errors";
import { buildLineWebAuthorizeUrl, exchangeLineAuthorizationCode, verifyLineIdToken } from "./line-web-auth";
import { eventEntryParams } from "../../utils/event-entry-intent";
import { activeBrowser, CookieContext, EventSsoError, freshAccount, hash, lockActiveBrowser, randomToken, ssoConfig } from "./event-sso";
const TYPE = "jaothui-web-event-line-attach";
export function attachStateHint(state: string) {
  const payload = jwt.decode(state); return typeof payload === "object" && payload?.typ === TYPE;
}
function safeReturnTo(returnTo: string) {
  const parsed = new URL(returnTo, "https://local.invalid");
  if (parsed.origin !== "https://local.invalid" || parsed.pathname !== "/v2/event-entry" || parsed.hash) throw new EventSsoError(400, "INVALID_RETURN_INTENT");
  try {
    if (new Set(parsed.searchParams.keys()).size !== Array.from(parsed.searchParams.keys()).length) throw new Error();
    return `${parsed.pathname}?${eventEntryParams(Object.fromEntries(parsed.searchParams))}`;
  } catch { throw new EventSsoError(400, "INVALID_RETURN_INTENT"); }
}
export async function beginLineAttach(ctx: CookieContext, returnTo: string, db: PrismaClient = prisma) {
  const config = ssoConfig(); const browser = await activeBrowser(ctx, db);
  const account = await freshAccount(browser.accountId, undefined, db);
  if (account.lineId) throw new EventSsoError(409, "LINE_ALREADY_LINKED");
  const id = randomToken(); const nonce = randomToken();
  await db.webLineAttachIntent.create({ data: { id: hash(id), browserId: browser.id, accountId: browser.accountId, nonce, returnTo: safeReturnTo(returnTo), expiresAt: new Date(Math.min(Date.now() + 600_000, browser.expiresAt.getTime())) } });
  const state = jwt.sign({ typ: TYPE, id, nonce }, config.stateSecret, { algorithm: "HS256", issuer: "jaothui", audience: TYPE, expiresIn: "10m" });
  return buildLineWebAuthorizeUrl({ state, nonce });
}
export async function completeLineAttach(ctx: CookieContext, input: { state: string; code: string }, db: PrismaClient = prisma, fetcher = fetch) {
  const payload = verifyAuthJwt(input.state, ssoConfig().stateSecret, { algorithms: ["HS256"], issuer: "jaothui", audience: TYPE });
  if (typeof payload !== "object" || payload.typ !== TYPE || typeof payload.id !== "string" || typeof payload.nonce !== "string") throw new EventSsoError(401, "INVALID_ATTACH_STATE");
  const browser = await activeBrowser(ctx, db);
  const intent = await db.webLineAttachIntent.findUnique({ where: { id: hash(payload.id) } });
  if (!intent || intent.browserId !== browser.id || intent.accountId !== browser.accountId || intent.nonce !== payload.nonce || intent.consumedAt || intent.expiresAt <= new Date()) throw new EventSsoError(401, "INVALID_ATTACH_STATE");
  // Claim before provider exchange. A code is never retried and profile proof is
  // persisted in the same transaction that attaches to the original account.
  const claimed = await db.webLineAttachIntent.updateMany({ where: { id: intent.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
  if (claimed.count !== 1) throw new EventSsoError(401, "ATTACH_ALREADY_USED");
  const tokens = await exchangeLineAuthorizationCode({ code: input.code, fetcher });
  const profile = await verifyLineIdToken({ idToken: tokens.idToken, nonce: intent.nonce, fetcher });
  return db.$transaction(async tx => {
    await lockActiveBrowser(tx, browser.id, browser.accountId);
    const account = await freshAccount(browser.accountId, undefined, tx);
    if (account.lineId && account.lineId !== profile.providerUserId) throw new EventSsoError(409, "LINE_ALREADY_LINKED");
    // Lock by provider subject as well: two accounts must not concurrently claim
    // the same LINE identity. This never merges accounts by profile/email.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`event-line:${profile.providerUserId}`}))::text`;
    const existing = await tx.accountIdentity.findUnique({ where: { provider_providerUserId: { provider: "line", providerUserId: profile.providerUserId } } });
    if (existing && existing.accountId !== browser.accountId) throw new EventSsoError(409, "LINE_IDENTITY_ALREADY_LINKED");
    if (!existing) await tx.accountIdentity.create({ data: { accountId: browser.accountId, provider: "line", ...profile } });
    await tx.webLineAttachIntent.update({ where: { id: intent.id }, data: { verifiedProfile: { lineIdentityHash: hash(profile.providerUserId), verifiedAt: new Date().toISOString() } } });
    return intent.returnTo;
  });
}
