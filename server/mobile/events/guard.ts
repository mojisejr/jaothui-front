import type { MobileAccountSessionPayload } from "../auth-session";
import { prisma } from "../../prisma";
import { EventError } from "./errors";
import { assertEventIdentityNamespace } from "./config";

export async function requireEventCustomer(session: MobileAccountSessionPayload | null, db = prisma, env = process.env) {
  if (!session) throw new EventError(401, "UNAUTHENTICATED", "กรุณาเข้าสู่ระบบ");
  if (session.primaryProvider !== "line" && session.primaryProvider !== "apple") throw new EventError(403, "CUSTOMER_REQUIRED", "ต้องใช้บัญชีสมาชิก");
  const account = await db.account.findUnique({ where: { id: session.accountId }, include: { identities: true } });
  if (!account || account.status !== "ACTIVE") throw new EventError(403, "ACCOUNT_NOT_ACTIVE", "บัญชีนี้ไม่พร้อมใช้งาน");
  if (account.role === "REVIEWER_SANDBOX") throw new EventError(403, "CUSTOMER_REQUIRED", "ต้องใช้บัญชีสมาชิก");
  assertEventIdentityNamespace(env);
  const lines = account.identities.filter(i => i.provider === "line");
  if (!lines.length) throw new EventError(403, "LINE_LINK_REQUIRED", "กรุณาเชื่อมต่อ LINE เพื่อสมัคร");
  if (lines.length !== 1 || !lines[0].providerUserId) throw new EventError(409, "MEMBER_AMBIGUOUS", "กรุณาติดต่อเจ้าหน้าที่เพื่อตรวจสอบสมาชิก");
  return { accountId: account.id, lineId: lines[0].providerUserId };
}
