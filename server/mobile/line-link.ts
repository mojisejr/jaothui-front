import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import { attachIdentityToAccount, AccountIdentityConflictError } from "../services/account.service";
import { exchangeLineAuthorizationCode, verifyLineIdToken, buildLineWebAuthorizeUrl, type LineWebAuthConfig } from "../auth/line-web-auth";
import { InvalidAuthError, AuthConfigurationError, verifyAuthJwt } from "../auth/errors";
import { createMobileAccountSession, type MobileAccountSessionPayload } from "./auth-session";
import { getLineMobileAuthConfig } from "./line-auth";
import { assertEventIdentityNamespace } from "./events/config";
import { docId } from "./events/service";
import { EventError, invalidFields } from "./events/errors";

const TYPE = "jaothui-mobile-line-link";
const PURPOSE = "attach-line";
const AUDIENCE = "jaothui-mobile-line-link-state";
const TTL_MS = 10 * 60 * 1000;
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const random = () => randomBytes(32).toString("hex");
const returnSchema = z.discriminatedUnion("kind", [z.object({ kind: z.literal("profile-link") }).strict(), z.object({ kind: z.literal("event-apply"), eventId: docId }).strict()]);
const bodySchema = z.object({ returnIntent: returnSchema }).strict();
type LinkState = { typ: typeof TYPE; purpose: typeof PURPOSE; id: string; accountId: string; nonce: string };
function secret(env: NodeJS.ProcessEnv) {
  const value = env.JAOTHUI_MOBILE_AUTH_SECRET || env.private_procedure_secret;
  if (!value) throw new AuthConfigurationError();
  return value;
}
export function isMobileLineLinkState(state: string) {
  const decoded = jwt.decode(state);
  return !!decoded && typeof decoded === "object" && decoded.typ === TYPE;
}
function verifyState(state: string, env: NodeJS.ProcessEnv): LinkState {
  const result = verifyAuthJwt(state, secret(env), { algorithms: ["HS256"], audience: AUDIENCE, issuer: "jaothui" });
  if (!result || typeof result !== "object" || result.typ !== TYPE || result.purpose !== PURPOSE || typeof result.id !== "string" || typeof result.accountId !== "string" || typeof result.nonce !== "string") throw new InvalidAuthError();
  return result as LinkState;
}
/** Used only to correlate an error return; it cannot authorize attachment. */
export function verifiedLineLinkIntentId(state: string, env: NodeJS.ProcessEnv = process.env) {
  return verifyState(state, env).id;
}
async function activeCustomer(session: MobileAccountSessionPayload | null, db: any) {
  if (!session) throw new EventError(401, "UNAUTHENTICATED", "กรุณาเข้าสู่ระบบ");
  if (session.primaryProvider !== "line" && session.primaryProvider !== "apple") throw new EventError(403, "CUSTOMER_REQUIRED", "ต้องใช้บัญชีสมาชิก");
  const account = await db.account.findUnique({ where: { id: session.accountId } });
  if (!account || account.status !== "ACTIVE") throw new EventError(403, "ACCOUNT_NOT_ACTIVE", "บัญชีนี้ไม่พร้อมใช้งาน");
  if (account.role === "REVIEWER_SANDBOX") throw new EventError(403, "CUSTOMER_REQUIRED", "ต้องใช้บัญชีสมาชิก");
  return account;
}
async function lockAccount(tx: any, accountId: string) {
  await tx.$queryRaw`SELECT "id" FROM "Account" WHERE "id"=${accountId} FOR UPDATE`;
}

export async function startLineLink(session: MobileAccountSessionPayload | null, input: unknown, options: { db?: any; env?: NodeJS.ProcessEnv; now?: Date; config?: LineWebAuthConfig } = {}) {
  const db = options.db ?? prisma, env = options.env ?? process.env, now = options.now ?? new Date();
  if (env.JAOTHUI_MOBILE_EVENTS_ENABLED !== "true") throw new EventError(503, "EVENTS_UNAVAILABLE", "ระบบกิจกรรมยังไม่พร้อมใช้งาน");
  const account = await activeCustomer(session, db);
  assertEventIdentityNamespace(env);
  const parsed = bodySchema.safeParse(input);
  if (!parsed.success) return invalidFields();
  const config = options.config ?? getLineMobileAuthConfig(env);
  const id = random(), nonce = random();
  const state = jwt.sign({ typ: TYPE, purpose: PURPOSE, id, accountId: account.id, nonce }, secret(env), { algorithm: "HS256", audience: AUDIENCE, issuer: "jaothui", expiresIn: "10m" });
  await db.$transaction(async (tx: any) => {
    await lockAccount(tx, account.id);
    await activeCustomer(session, tx);
    // Bounded retention of expired ephemeral auth state; never touches identities/applications.
    const expired = await tx.mobileLineLinkIntent.findMany({ where: { expiresAt: { lt: now } }, orderBy: { expiresAt: "asc" }, take: 100, select: { id: true } });
    if (expired.length) await tx.mobileLineLinkIntent.deleteMany({ where: { id: { in: expired.map((row: { id: string }) => row.id) } } });
    await tx.mobileLineLinkIntent.updateMany({ where: { accountId: account.id, purpose: PURPOSE, consumedAt: null }, data: { consumedAt: now, verifiedProfile: Prisma.DbNull } });
    await tx.mobileLineLinkIntent.create({ data: { id, accountId: account.id, purpose: PURPOSE, returnIntent: parsed.data.returnIntent, stateNonceHash: sha(nonce), expiresAt: new Date(now.getTime() + TTL_MS) } });
  });
  return { authorizeUrl: buildLineWebAuthorizeUrl({ state, nonce, config }), intentId: id, returnTo: "jaothui://oauth/callback" as const };
}

export async function cancelLineLink(session: MobileAccountSessionPayload | null, intentId: string, db: any = prisma) {
  const account = await activeCustomer(session, db);
  if (!/^[a-f0-9]{64}$/.test(intentId)) return invalidFields();
  await db.mobileLineLinkIntent.updateMany({ where: { id: intentId, accountId: account.id, purpose: PURPOSE, consumedAt: null }, data: { consumedAt: new Date(), verifiedProfile: Prisma.DbNull } });
  return { cancelled: true };
}

export async function cancelLineLinkCallback(stateToken: string, db: any = prisma, env = process.env) {
  const state = verifyState(stateToken, env);
  await db.mobileLineLinkIntent.updateMany({ where: { id: state.id, accountId: state.accountId, stateNonceHash: sha(state.nonce), purpose: PURPOSE, consumedAt: null }, data: { consumedAt: new Date(), verifiedProfile: Prisma.DbNull } });
}

export async function completeLineLinkCallback(input: { state: string; code: string }, options: { db?: any; env?: NodeJS.ProcessEnv; fetcher?: typeof fetch; config?: LineWebAuthConfig } = {}) {
  const db = options.db ?? prisma, env = options.env ?? process.env, state = verifyState(input.state, env), now = new Date();
  assertEventIdentityNamespace(env);
  const intent = await db.mobileLineLinkIntent.findUnique({ where: { id: state.id } });
  if (!intent || intent.accountId !== state.accountId || intent.purpose !== PURPOSE || intent.stateNonceHash !== sha(state.nonce) || intent.consumedAt || intent.expiresAt <= now) throw new InvalidAuthError();
  const account = await db.account.findUnique({ where: { id: state.accountId } });
  if (!account || account.status !== "ACTIVE" || account.role === "REVIEWER_SANDBOX") throw new InvalidAuthError();
  const claimed = await db.mobileLineLinkIntent.updateMany({ where: { id: state.id, callbackClaimedAt: null, consumedAt: null, expiresAt: { gt: now } }, data: { callbackClaimedAt: now } });
  if (claimed.count !== 1) throw new InvalidAuthError("LINE link callback already used");
  const config = options.config ?? getLineMobileAuthConfig(env);
  const tokens = await exchangeLineAuthorizationCode({ code: input.code, config, fetcher: options.fetcher });
  // Strict claims for this new attach lane; keep the older login contract untouched.
  const fetcher = options.fetcher ?? fetch;
  const strictVerify = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const response = await fetcher(url, init);
    if (response.ok) {
      const claims = await response.clone().json();
      if (claims.aud !== config.channelId || claims.nonce !== state.nonce || typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) throw new InvalidAuthError("Invalid LINE attach claims");
    }
    return response;
  }) as typeof fetch;
  const profile = await verifyLineIdToken({ idToken: tokens.idToken, nonce: state.nonce, config, fetcher: strictVerify });
  const handoff = random();
  await db.$transaction(async (tx: any) => {
    await lockAccount(tx, state.accountId);
    const current = await tx.account.findUnique({ where: { id: state.accountId } });
    if (!current || current.status !== "ACTIVE" || current.role === "REVIEWER_SANDBOX") throw new InvalidAuthError();
    const stored = await tx.mobileLineLinkIntent.updateMany({ where: { id: state.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { handoffHash: sha(handoff), verifiedProfile: profile } });
    if (stored.count !== 1) throw new InvalidAuthError();
  });
  const url = new URL("jaothui://oauth/callback");
  url.searchParams.set("provider", "line"); url.searchParams.set("purpose", "link"); url.searchParams.set("handoff", handoff); url.searchParams.set("intentId", state.id);
  return url.toString();
}

export async function redeemLineLink(session: MobileAccountSessionPayload | null, input: unknown, options: { db?: any; now?: Date } = {}) {
  const db = options.db ?? prisma, now = options.now ?? new Date();
  const parsed = z.object({ intentId: z.string().regex(/^[a-f0-9]{64}$/), handoff: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(input);
  if (!parsed.success) return invalidFields();
  const account = await activeCustomer(session, db);
  let receipt: { account: any; returnIntent: unknown; replayed: boolean };
  try {
    receipt = await db.$transaction(async (tx: any) => {
      await lockAccount(tx, account.id);
      await activeCustomer(session, tx);
      const intent = await tx.mobileLineLinkIntent.findUnique({ where: { id: parsed.data.intentId } });
      if (!intent || intent.accountId !== account.id || intent.purpose !== PURPOSE || intent.handoffHash !== sha(parsed.data.handoff) || intent.expiresAt <= now) throw new InvalidAuthError();
      const profile = intent.verifiedProfile;
      const lines = await tx.accountIdentity.findMany({ where: { accountId: account.id, provider: "line" } });
      if (intent.consumedAt) {
        // A response-lost retry may recover the SAME account receipt; it never reattaches.
        if (!intent.redeemedAt || !lines.some((identity: any) => sha(identity.providerUserId) === intent.linkedIdentityHash)) throw new InvalidAuthError();
        return { account: await tx.account.findUnique({ where: { id: account.id }, include: { identities: true, walletLinks: true } }), returnIntent: intent.returnIntent, replayed: true };
      }
      if (!profile || typeof profile.providerUserId !== "string") throw new InvalidAuthError();
      if (lines.some((identity: any) => identity.providerUserId !== profile.providerUserId)) throw new EventError(409, "LINE_IDENTITY_CONFLICT", "บัญชีนี้เชื่อมต่อ LINE อื่นอยู่แล้ว");
      const consumed = await tx.mobileLineLinkIntent.updateMany({ where: { id: intent.id, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now, redeemedAt: now, linkedIdentityHash: sha(profile.providerUserId), verifiedProfile: Prisma.DbNull } });
      if (consumed.count !== 1) throw new InvalidAuthError();
      const linked = await attachIdentityToAccount(account.id, { provider: "line", ...profile }, tx);
      return { account: linked, returnIntent: intent.returnIntent, replayed: false };
    });
  } catch (error) {
    if (error instanceof AccountIdentityConflictError || (error as { code?: string }).code === "P2002") throw new EventError(409, "LINE_IDENTITY_CONFLICT", "LINE นี้เชื่อมกับบัญชีอื่นแล้ว");
    throw error;
  }
  const current = receipt.account, prior = session!;
  const wallet = current.walletLinks?.filter((value: any) => value.status === "LINKED").sort((a: any, b: any) => +new Date(b.linkedAt) - +new Date(a.linkedAt))[0];
  const refreshed = { accountId: current.id, primaryProvider: prior.primaryProvider, providerUserId: prior.providerUserId,
    email: current.email, displayName: current.displayName, avatarUrl: current.avatarUrl,
    linkedWallet: wallet ? { walletAddress: wallet.walletAddress, provider: "bitkub-next" as const, email: wallet.email } : null };
  const token = createMobileAccountSession(refreshed);
  return { sessionToken: token.token, expiresAt: token.expiresAt,
    identity: { sessionVersion: 2 as const, provider: prior.primaryProvider, accountId: current.id, providerUserId: prior.providerUserId,
      ...(prior.primaryProvider === "line" ? { lineUserId: prior.providerUserId } : { appleUserId: prior.providerUserId }),
      email: refreshed.email, displayName: refreshed.displayName, avatarUrl: refreshed.avatarUrl, linkedWallet: refreshed.linkedWallet },
    returnIntent: receipt.returnIntent, replayed: receipt.replayed };
}
