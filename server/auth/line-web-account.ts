import {
  getAccountProfile,
  type AccountServiceClient,
} from "../services/account.service";
import type { LineWebSessionPayload } from "./line-web-session";

type LinkedWalletIdentity = {
  walletAddress: string;
  provider: "bitkub-next";
  email: string | null;
};

export type LineWebAccountResponse = {
  accountId: string;
  provider: "line";
  lineUserId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  linkedWallet: LinkedWalletIdentity | null;
};

export function mapLinkedWalletIdentity(wallet: any): LinkedWalletIdentity | null {
  if (!wallet?.walletAddress) {
    return null;
  }

  return {
    walletAddress: wallet.walletAddress,
    provider: "bitkub-next",
    email: typeof wallet.email === "string" ? wallet.email : null,
  };
}

export async function getFreshLineWebAccount(
  session: LineWebSessionPayload,
  client?: AccountServiceClient
): Promise<LineWebAccountResponse | null> {
  const profile = await getAccountProfile(session.accountId, client);
  if (!profile) {
    return null;
  }

  return {
    accountId: session.accountId,
    provider: "line",
    lineUserId: session.lineUserId,
    email: session.email,
    displayName: session.displayName,
    avatarUrl: session.avatarUrl,
    linkedWallet:
      mapLinkedWalletIdentity(profile.linkedWallet) ?? session.linkedWallet,
  };
}
