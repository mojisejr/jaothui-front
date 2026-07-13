import { prisma } from "../prisma";

const LINE_PROVIDER = "line";
const BITKUB_NEXT_PROVIDER = "bitkub-next";
const LINKED_STATUS = "LINKED";

type NullableString = string | null;

export type LineAccountInput = {
  providerUserId: string;
  email?: NullableString;
  displayName?: NullableString;
  avatarUrl?: NullableString;
};

export type WalletLinkInput = {
  email?: NullableString;
  provider?: string;
  verifiedAt?: Date | null;
};

export type AccountServiceClient = {
  accountIdentity: {
    upsert: (args: any) => Promise<any>;
  };
  account: {
    findUnique: (args: any) => Promise<any>;
  };
  walletLink: {
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };
};

export class WalletLinkConflictError extends Error {
  readonly code = "WALLET_ALREADY_LINKED";
  readonly accountId: string;
  readonly walletAddress: string;

  constructor(walletAddress: string, accountId: string) {
    super(`Wallet ${walletAddress} is already linked to another account`);
    this.name = "WalletLinkConflictError";
    this.accountId = accountId;
    this.walletAddress = walletAddress;
  }
}

const normalizeOptionalString = (value: string | null | undefined) =>
  value ?? null;

export const normalizeWalletAddress = (walletAddress: string) => {
  const normalized = walletAddress.trim().toLowerCase();
  if (!normalized) {
    throw new Error("walletAddress is required");
  }
  return normalized;
};

export const findOrCreateLineAccount = async (
  input: LineAccountInput,
  client: AccountServiceClient = prisma
) => {
  const providerUserId = input.providerUserId.trim();
  if (!providerUserId) {
    throw new Error("providerUserId is required");
  }

  const email = normalizeOptionalString(input.email);
  const displayName = normalizeOptionalString(input.displayName);
  const avatarUrl = normalizeOptionalString(input.avatarUrl);

  const identity = await client.accountIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider: LINE_PROVIDER,
        providerUserId,
      },
    },
    create: {
      provider: LINE_PROVIDER,
      providerUserId,
      email,
      displayName,
      avatarUrl,
      account: {
        create: {
          email,
          displayName,
          avatarUrl,
        },
      },
    },
    update: {
      email,
      displayName,
      avatarUrl,
      account: {
        update: {
          email,
          displayName,
          avatarUrl,
        },
      },
    },
    include: {
      account: {
        include: {
          identities: true,
          walletLinks: true,
        },
      },
    },
  });

  return identity.account;
};

export const getLinkedWallet = async (
  accountId: string,
  client: AccountServiceClient = prisma
) => {
  return client.walletLink.findFirst({
    where: {
      accountId,
      status: LINKED_STATUS,
    },
    orderBy: {
      linkedAt: "desc",
    },
  });
};

export const linkWalletToAccount = async (
  accountId: string,
  walletAddress: string,
  metadata: WalletLinkInput = {},
  client: AccountServiceClient = prisma
) => {
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);
  const existing = await client.walletLink.findUnique({
    where: {
      walletAddress: normalizedWalletAddress,
    },
  });

  if (existing) {
    if (existing.accountId === accountId) {
      return existing;
    }
    throw new WalletLinkConflictError(normalizedWalletAddress, existing.accountId);
  }

  return client.walletLink.create({
    data: {
      accountId,
      walletAddress: normalizedWalletAddress,
      provider: metadata.provider ?? BITKUB_NEXT_PROVIDER,
      email: normalizeOptionalString(metadata.email),
      status: LINKED_STATUS,
      verifiedAt: metadata.verifiedAt ?? null,
    },
  });
};

export const getAccountProfile = async (
  accountId: string,
  client: AccountServiceClient = prisma
) => {
  const account = await client.account.findUnique({
    where: { id: accountId },
    include: {
      identities: true,
      walletLinks: {
        where: {
          status: LINKED_STATUS,
        },
        orderBy: {
          linkedAt: "desc",
        },
      },
    },
  });

  if (!account) {
    return null;
  }

  return {
    account,
    linkedWallet: account.walletLinks[0] ?? null,
  };
};

