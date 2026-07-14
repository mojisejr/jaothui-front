import {
  findOrCreateLineAccount,
  getLinkedWallet,
  type AccountServiceClient,
} from "../services/account.service";
import {
  completeLineWebCallbackContract,
  type LineWebAuthConfig,
} from "./line-web-auth";
import { createLineWebSession } from "./line-web-session";

type FetchLike = typeof fetch;

function mapLinkedWallet(wallet: any) {
  if (!wallet?.walletAddress) {
    return null;
  }

  return {
    walletAddress: wallet.walletAddress,
    provider: "bitkub-next" as const,
    email: typeof wallet.email === "string" ? wallet.email : null,
  };
}

export async function completeLineWebLogin(input: {
  code: string;
  state: string;
  config?: LineWebAuthConfig;
  env?: Record<string, string | undefined>;
  fetcher?: FetchLike;
  accountClient?: AccountServiceClient;
}) {
  const callback = await completeLineWebCallbackContract({
    code: input.code,
    state: input.state,
    config: input.config,
    env: input.env,
    fetcher: input.fetcher,
  });
  const account = await findOrCreateLineAccount(
    {
      providerUserId: callback.profile.providerUserId,
      email: callback.profile.email,
      displayName: callback.profile.displayName,
      avatarUrl: callback.profile.avatarUrl,
    },
    input.accountClient
  );
  const linkedWallet = await getLinkedWallet(account.id, input.accountClient);
  const session = createLineWebSession({
    accountId: account.id,
    lineUserId: callback.profile.providerUserId,
    email: callback.profile.email,
    displayName: callback.profile.displayName,
    avatarUrl: callback.profile.avatarUrl,
    linkedWallet: mapLinkedWallet(linkedWallet),
  });

  return {
    returnTo: callback.state.returnTo,
    account,
    profile: callback.profile,
    session,
  };
}
