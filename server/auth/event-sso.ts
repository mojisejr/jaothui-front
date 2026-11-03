import { createHash, randomBytes, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import { getCookie, setCookie } from "cookies-next";
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../prisma";
import { assertEventIdentityNamespace } from "../mobile/events/config";
import { LINE_WEB_SESSION_COOKIE, verifyLineWebSessionToken } from "./line-web-session";
import { InvalidAuthError, verifyAuthJwt } from "./errors";

export const BROWSER_COOKIE = "jaothui_browser_sid";
export type CookieContext = { req: NextApiRequest | GetServerSidePropsContext["req"]; res: NextApiResponse | GetServerSidePropsContext["res"] };
type Db = PrismaClient | Prisma.TransactionClient;
export class EventSsoError extends Error {
  constructor(public status: number, public code: string, public missingVariables?: readonly string[]) { super(code); this.name = "EventSsoError"; }
}
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
export const pkceChallenge = (value: string) => createHash("sha256").update(value).digest("base64url");
export const ssoEnabled = () => process.env.JAOTHUI_EVENT_SSO_ENABLED === "true";
export function ssoConfig() {
  if (!ssoEnabled()) throw new EventSsoError(404, "SSO_DISABLED");
  try { assertEventIdentityNamespace(); } catch { throw new EventSsoError(503, "IDENTITY_MAPPING_UNVERIFIED", process.env.JAOTHUI_LINE_LOGIN_CHANNEL_ID ? [] : ["JAOTHUI_LINE_LOGIN_CHANNEL_ID"]); }
  const missingVariables = ["JAOTHUI_FRONT_ORIGIN", "JAOTHUI_EVENT_ORIGIN", "JAOTHUI_EVENT_SSO_CLIENT_SECRET", "JAOTHUI_EVENT_SSO_STATE_SECRET"].filter(name => !process.env[name]?.trim());
  if (missingVariables.length) throw new EventSsoError(503, "SSO_CONFIGURATION_UNAVAILABLE", missingVariables);
  const clientSecret = process.env.JAOTHUI_EVENT_SSO_CLIENT_SECRET ?? "";
  const stateSecret = process.env.JAOTHUI_EVENT_SSO_STATE_SECRET ?? "";
  function origin(raw: string | undefined) {
    try {
      const url = new URL(raw ?? "");
      if (url.origin !== raw || url.username || url.password || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new Error();
      return url.origin;
    } catch { throw new EventSsoError(503, "SSO_CONFIGURATION_UNAVAILABLE"); }
  }
  if (clientSecret.length < 32 || stateSecret.length < 32 || clientSecret === stateSecret || [process.env.private_procedure_secret, process.env.JAOTHUI_MOBILE_AUTH_SECRET, process.env.JAOTHUI_WEB_AUTH_SECRET].some(secret => secret && (secret === clientSecret || secret === stateSecret))) throw new EventSsoError(503, "SSO_CONFIGURATION_UNAVAILABLE");
  const frontOrigin = origin(process.env.JAOTHUI_FRONT_ORIGIN);
  const eventOrigin = origin(process.env.JAOTHUI_EVENT_ORIGIN);
  return { clientSecret, stateSecret, frontOrigin, eventOrigin, redirectUri: `${eventOrigin}/api/auth/front/callback` };
}
export function sameOrigin(req: CookieContext["req"]) {
  const { frontOrigin } = ssoConfig();
  if (req.headers.origin !== frontOrigin || req.headers["sec-fetch-site"] === "cross-site") throw new EventSsoError(403, "CSRF_REJECTED");
}
export function requireClient(req: NextApiRequest) {
  const expected = `Bearer ${ssoConfig().clientSecret}`;
  const actual = req.headers.authorization ?? "";
  if (Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) throw new EventSsoError(401, "INVALID_CLIENT");
}
export function noStore(res: CookieContext["res"]) {
  res.setHeader("Cache-Control", "no-store"); res.setHeader("Referrer-Policy", "no-referrer");
}
export const eventIdSchema = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;
export function validEventId(value: unknown): string {
  if (typeof value !== "string" || !eventIdSchema.test(value) || value.includes("..") || /^(drafts|versions|_)\./.test(value)) throw new EventSsoError(400, "INVALID_EVENT");
  return value;
}
function cookie(ctx: CookieContext, name: string) {
  const value = getCookie(name, ctx); return typeof value === "string" ? value : "";
}
function setBrowser(ctx: CookieContext, value: string, maxAge: number) {
  setCookie(BROWSER_COOKIE, value, { ...ctx, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
}
export type Principal = { accountId: string; credentialHash: string; credentialKind: string; credentialSubject: string; expiresAt: Date };
export async function freshAccount(accountId: string, lineId?: string, db: Db = prisma) {
  const account = await db.account.findUnique({ where: { id: accountId }, include: { identities: true } });
  if (!account || account.status !== "ACTIVE" || account.deletedAt) throw new EventSsoError(401, "ACCOUNT_INACTIVE");
  if (account.role === "REVIEWER_SANDBOX") throw new EventSsoError(403, "REVIEWER_APPLICANT_FORBIDDEN");
  const lines = account.identities.filter(i => i.provider === "line");
  if (lines.length > 1) throw new EventSsoError(409, "LINE_IDENTITY_AMBIGUOUS");
  const line = lines[0];
  if (lineId && line?.providerUserId !== lineId) throw new EventSsoError(409, "LINE_IDENTITY_CHANGED");
  return { accountId: account.id, lineId: line?.providerUserId ?? null, displayName: line?.displayName ?? account.displayName, avatarUrl: line?.avatarUrl ?? account.avatarUrl, email: line?.email ?? account.email };
}
export async function resolvePrincipal(ctx: CookieContext, db: PrismaClient = prisma): Promise<Principal> {
  ssoConfig();
  const lineToken = cookie(ctx, LINE_WEB_SESSION_COOKIE);
  const walletToken = cookie(ctx, "session_token");
  const candidates: Principal[] = [];
  let invalidCredential = false;
  if (lineToken) {
    try {
      const session = verifyLineWebSessionToken(lineToken);
      await freshAccount(session.accountId, session.lineUserId, db);
      candidates.push({ accountId: session.accountId, credentialKind: "line", credentialSubject: session.lineUserId, credentialHash: hash(lineToken), expiresAt: new Date((session.exp ?? 0) * 1000) });
    } catch (error) { if (!(error instanceof InvalidAuthError)) throw error; invalidCredential = true; }
  }
  if (walletToken) {
    let payload: jwt.JwtPayload | null = null;
    try {
      const decoded = verifyAuthJwt(walletToken, process.env.private_procedure_secret ?? "", { algorithms: ["HS256"], issuer: "jaothui", audience: "jaothui-user" });
      if (typeof decoded === "object" && typeof decoded.wallet === "string") payload = decoded;
      else invalidCredential = true;
    } catch (error) { if (!(error instanceof InvalidAuthError)) throw error; invalidCredential = true; }
    if (payload) {
      let link = await db.walletLink.findUnique({ where: { walletAddress: payload.wallet.toLowerCase() } });
      if (!link) { await walletLoginPrincipal(payload.wallet, walletToken, db); link = await db.walletLink.findUnique({ where: { walletAddress: payload.wallet.toLowerCase() } }); }
      if (!link || link.status !== "LINKED" || !link.verifiedAt) throw new EventSsoError(401, "WALLET_ACCOUNT_UNVERIFIED");
      await freshAccount(link.accountId, undefined, db);
      candidates.push({ accountId: link.accountId, credentialKind: "bitkub-next", credentialSubject: payload.wallet.toLowerCase(), credentialHash: hash(walletToken), expiresAt: new Date((payload.exp ?? 0) * 1000) });
    }
  }
  if (lineToken && walletToken && invalidCredential) throw new EventSsoError(409, "ACCOUNT_SELECTION_REQUIRED");
  if (!candidates.length) throw new EventSsoError(401, "LOGIN_REQUIRED");
  if (new Set(candidates.map(c => c.accountId)).size !== 1) throw new EventSsoError(409, "ACCOUNT_SELECTION_REQUIRED");
  // The exact chosen credential is bound to this family, never JWT timestamps.
  return candidates[0];
}
export async function revokeBrowser(ctx: CookieContext, db: Db = prisma) {
  if (!ssoEnabled()) return;
  ssoConfig();
  const sid = cookie(ctx, BROWSER_COOKIE);
  if (sid) await db.webBrowserSession.updateMany({ where: { id: hash(sid), revokedAt: null }, data: { revokedAt: new Date() } });
}
export async function establishBrowser(ctx: CookieContext, principal: Principal, db: PrismaClient = prisma) {
  if (!ssoEnabled()) return;
  ssoConfig();
  const sid = randomToken();
  const browser = await db.$transaction(async tx => {
    await revokeBrowser(ctx, tx);
    return tx.webBrowserSession.create({ data: { id: hash(sid), ...principal } });
  });
  setBrowser(ctx, sid, Math.max(0, Math.floor((principal.expiresAt.getTime() - Date.now()) / 1000)));
  return browser;
}
export async function activeBrowser(ctx: CookieContext, db: PrismaClient = prisma) {
  const principal = await resolvePrincipal(ctx, db);
  const sid = cookie(ctx, BROWSER_COOKIE);
  if (!sid) {
    return (await establishBrowser(ctx, principal, db))!;
  }
  const browser = await db.webBrowserSession.findUnique({ where: { id: hash(sid) } });
  if (!browser || browser.revokedAt || browser.expiresAt <= new Date() || browser.accountId !== principal.accountId || browser.credentialHash !== principal.credentialHash || browser.credentialKind !== principal.credentialKind) throw new EventSsoError(401, "BROWSER_SESSION_INVALID");
  return browser;
}
export async function walletLoginPrincipal(wallet: string, token: string, db: PrismaClient = prisma): Promise<Principal> {
  const normalized = wallet.toLowerCase();
  const linked = await db.walletLink.upsert({ where: { walletAddress: normalized }, update: { verifiedAt: new Date() }, create: { walletAddress: normalized, verifiedAt: new Date(), account: { create: {} } } });
  if (linked.status !== "LINKED") throw new EventSsoError(409, "WALLET_ACCOUNT_UNVERIFIED");
  await freshAccount(linked.accountId, undefined, db);
  return { accountId: linked.accountId, credentialHash: hash(token), credentialKind: "bitkub-next", credentialSubject: normalized, expiresAt: new Date((jwt.decode(token) as jwt.JwtPayload).exp! * 1000) };
}
export async function authorizeGrant(ctx: CookieContext, input: { eventId: string; state: string; challenge: string }, db: PrismaClient = prisma) {
  const config = ssoConfig(); validEventId(input.eventId);
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(input.state) || !/^[A-Za-z0-9_-]{43}$/.test(input.challenge)) throw new EventSsoError(400, "INVALID_AUTHORIZATION_REQUEST");
  const browser = await activeBrowser(ctx, db);
  const account = await freshAccount(browser.accountId, undefined, db);
  if (!account.lineId) throw new EventSsoError(409, "LINE_LINK_REQUIRED");
  const code = randomToken();
  await db.webEventGrant.create({ data: { id: hash(code), browserId: browser.id, accountId: account.accountId, lineId: account.lineId, stateHash: hash(input.state), challenge: input.challenge, redirectUri: config.redirectUri, eventId: input.eventId, expiresAt: new Date(Math.min(Date.now() + 120_000, browser.expiresAt.getTime())) } });
  const callback = new URL(config.redirectUri); callback.searchParams.set("code", code); callback.searchParams.set("state", input.state); return callback.toString();
}
export async function lockActiveBrowser(db: Prisma.TransactionClient, browserId: string, accountId: string) {
  // A shared lock order serializes redemption/introspection with root revocation and deletion.
  await db.$queryRaw`SELECT "id" FROM "Account" WHERE "id"=${accountId} FOR UPDATE`;
  await db.$queryRaw`SELECT "id" FROM "WebBrowserSession" WHERE "id"=${browserId} FOR UPDATE`;
  const parent = await db.webBrowserSession.findUnique({ where: { id: browserId } });
  if (!parent || parent.accountId !== accountId || parent.revokedAt || parent.expiresAt <= new Date()) throw new EventSsoError(401, "SESSION_REVOKED");
  if (parent.credentialKind === "bitkub-next") {
    const link = await db.walletLink.findUnique({ where: { walletAddress: parent.credentialSubject } });
    if (!link || link.accountId !== accountId || link.status !== "LINKED" || !link.verifiedAt) throw new EventSsoError(409, "WALLET_IDENTITY_CHANGED");
  } else if (parent.credentialKind === "line") {
    await freshAccount(accountId, parent.credentialSubject, db);
  } else throw new EventSsoError(401, "INVALID_CREDENTIAL_BINDING");
  return parent;
}
export async function exchangeGrant(input: { code: string; codeVerifier: string; redirectUri: string }, db: PrismaClient = prisma) {
  const config = ssoConfig();
  if (input.redirectUri !== config.redirectUri || !/^[A-Za-z0-9_-]{43}$/.test(input.code) || !/^[A-Za-z0-9._~-]{43,128}$/.test(input.codeVerifier)) throw new EventSsoError(400, "INVALID_EXCHANGE");
  return db.$transaction(async tx => {
    const grant = await tx.webEventGrant.findUnique({ where: { id: hash(input.code) } });
    if (!grant || grant.consumedAt || grant.expiresAt <= new Date() || grant.redirectUri !== input.redirectUri || grant.challenge !== pkceChallenge(input.codeVerifier)) throw new EventSsoError(401, "INVALID_GRANT");
    const parent = await lockActiveBrowser(tx, grant.browserId, grant.accountId);
    const account = await freshAccount(grant.accountId, grant.lineId, tx);
    const consumed = await tx.webEventGrant.updateMany({ where: { id: grant.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) throw new EventSsoError(401, "INVALID_GRANT");
    const sessionToken = randomToken(); const expiresAt = parent.expiresAt;
    await tx.webEventSession.create({ data: { id: hash(sessionToken), browserId: parent.id, accountId: account.accountId, lineId: grant.lineId, expiresAt } });
    return { sessionToken, expiresAt: expiresAt.toISOString(), account, eventId: grant.eventId };
  });
}
export async function introspectSession(sessionToken: string, db: PrismaClient = prisma) {
  ssoConfig();
  if (!/^[A-Za-z0-9_-]{43}$/.test(sessionToken)) throw new EventSsoError(401, "INVALID_SESSION");
  return db.$transaction(async tx => {
    const session = await tx.webEventSession.findUnique({ where: { id: hash(sessionToken) } });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) throw new EventSsoError(401, "INVALID_SESSION");
    await lockActiveBrowser(tx, session.browserId, session.accountId);
    const account = await freshAccount(session.accountId, session.lineId, tx);
    // Re-read after acquiring parent lock: revoke requests use the same lock.
    if ((await tx.webEventSession.findUnique({ where: { id: session.id } }))?.revokedAt) throw new EventSsoError(401, "SESSION_REVOKED");
    return { expiresAt: session.expiresAt.toISOString(), account };
  });
}
export async function revokeEventSession(sessionToken: string, db: PrismaClient = prisma) {
  ssoConfig();
  if (!/^[A-Za-z0-9_-]{43}$/.test(sessionToken)) throw new EventSsoError(400, "INVALID_SESSION");
  await db.$transaction(async tx => {
    const session = await tx.webEventSession.findUnique({ where: { id: hash(sessionToken) } });
    if (!session) return;
    await tx.$queryRaw`SELECT "id" FROM "WebBrowserSession" WHERE "id"=${session.browserId} FOR UPDATE`;
    await tx.webEventSession.updateMany({ where: { browserId: session.browserId, revokedAt: null }, data: { revokedAt: new Date() } });
  });
}
export function ssoFailure(error: unknown) {
  if (error instanceof InvalidAuthError) return new EventSsoError(401, "INVALID_AUTH");
  return error instanceof EventSsoError ? error : new EventSsoError(503, "SSO_UNAVAILABLE");
}
