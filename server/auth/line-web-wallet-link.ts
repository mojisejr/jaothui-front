import { getUserData } from "../../helpers/getUserData";
import {
  linkWalletToAccount,
  WalletLinkConflictError,
  type AccountServiceClient,
} from "../services/account.service";
import type { LineWebSessionPayload } from "./line-web-session";
import { getFreshLineWebAccount, type LineWebAccountResponse } from "./line-web-account";

export type BitkubNextUserData = Awaited<ReturnType<typeof getUserData>>;
export type BitkubNextUserFetcher = (
  accessToken: string
) => Promise<BitkubNextUserData>;

export class BitkubNextAuthError extends Error {
  readonly code = "BITKUB_NEXT_AUTH_INVALID";

  constructor(message = "Invalid Bitkub NEXT session") {
    super(message);
    this.name = "BitkubNextAuthError";
  }
}

export class LineWebAccountMissingError extends Error {
  readonly code = "LINE_ACCOUNT_MISSING";

  constructor(accountId: string) {
    super(`LINE account ${accountId} was not found`);
    this.name = "LineWebAccountMissingError";
  }
}

export async function linkBitkubNextWalletToLineAccount(input: {
  session: LineWebSessionPayload;
  accessToken: string;
  client?: AccountServiceClient;
  fetchBitkubUserData?: BitkubNextUserFetcher;
  now?: () => Date;
}): Promise<LineWebAccountResponse> {
  const accessToken = input.accessToken.trim();
  if (!accessToken) {
    throw new BitkubNextAuthError("Missing Bitkub NEXT access token");
  }

  const fetchBitkubUserData = input.fetchBitkubUserData ?? getUserData;
  const userData = await fetchBitkubUserData(accessToken);
  if (!userData.success || !userData.wallet_address) {
    throw new BitkubNextAuthError();
  }

  await linkWalletToAccount(
    input.session.accountId,
    userData.wallet_address,
    {
      email: typeof userData.email === "string" ? userData.email : null,
      verifiedAt: input.now?.() ?? new Date(),
    },
    input.client
  );

  const account = await getFreshLineWebAccount(input.session, input.client);
  if (!account) {
    throw new LineWebAccountMissingError(input.session.accountId);
  }

  return account;
}

export function toWalletLinkErrorResponse(error: unknown) {
  if (error instanceof BitkubNextAuthError) {
    return {
      status: 401,
      body: {
        success: false as const,
        code: error.code,
        message: error.message,
      },
    };
  }

  if (error instanceof WalletLinkConflictError) {
    return {
      status: 409,
      body: {
        success: false as const,
        code: error.code,
        message: "This Bitkub NEXT wallet is already linked to another account",
      },
    };
  }

  if (error instanceof LineWebAccountMissingError) {
    return {
      status: 401,
      body: {
        success: false as const,
        code: error.code,
        message: "Invalid LINE session",
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false as const,
      code: "WALLET_LINK_FAILED",
      message: "Unable to link Bitkub NEXT wallet",
    },
  };
}
