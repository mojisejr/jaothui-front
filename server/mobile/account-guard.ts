import type { MobileAccountSessionPayload, MobileSessionPayload } from "./auth-session";
import { requireActiveAccount, AccountNotActiveError } from "../services/account.service";
import { prisma } from "../prisma";

function isAccountSession(
  session: MobileSessionPayload
): session is MobileAccountSessionPayload {
  return "sessionVersion" in session && session.sessionVersion === 2;
}

/**
 * Version-2 sessions are stateless JWTs, so their Account must remain active
 * in the database. Version-1 Bitkub sessions deliberately have no Account id
 * and remain outside this Account-only remediation.
 */
export async function requireActiveMobileAccountSession(
  session: MobileSessionPayload,
  client: Pick<typeof prisma, "account"> = prisma
) {
  if (!isAccountSession(session)) {
    return session;
  }

  await requireActiveAccount(session.accountId, client);
  return session;
}

export function isInactiveMobileAccountError(error: unknown) {
  return error instanceof AccountNotActiveError;
}
