import { prisma } from "../prisma";

const LINE_PROVIDER = "line";
const APPLE_PROVIDER = "apple";
const REVIEWER_PROVIDER = "reviewer";
const BITKUB_NEXT_PROVIDER = "bitkub-next";
const LINKED_STATUS = "LINKED";
export const REVIEWER_SANDBOX_ROLE = "REVIEWER_SANDBOX";

type NullableString = string | null;
export type AccountIdentityProvider =
  | typeof LINE_PROVIDER
  | typeof APPLE_PROVIDER
  | typeof REVIEWER_PROVIDER;

export type LineAccountInput = {
  providerUserId: string;
  email?: NullableString;
  displayName?: NullableString;
  avatarUrl?: NullableString;
};

export type AccountIdentityInput = LineAccountInput & {
  provider: AccountIdentityProvider;
  accountRole?: typeof REVIEWER_SANDBOX_ROLE;
};

export type WalletLinkInput = {
  email?: NullableString;
  provider?: string;
  verifiedAt?: Date | null;
};

export type AccountServiceClient = {
  accountIdentity: {
    upsert: (args: any) => Promise<any>;
    findUnique?: (args: any) => Promise<any>;
    create?: (args: any) => Promise<any>;
    update?: (args: any) => Promise<any>;
  };
  account: {
    findUnique: (args: any) => Promise<any>;
    update?: (args: any) => Promise<any>;
  };
  walletLink: {
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };
};

type AccountDeletionTransactionClient = {
  account: {
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  accountIdentity: {
    deleteMany: (args: any) => Promise<{ count: number }>;
  };
  walletLink: {
    deleteMany: (args: any) => Promise<{ count: number }>;
  };
};

export type AccountDeletionClient = {
  $transaction: <T>(
    operation: (transaction: AccountDeletionTransactionClient) => Promise<T>
  ) => Promise<T>;
};

export const ACCOUNT_DELETION_POLICY_VERSION = "2026-08-13";

export class AccountIdentityConflictError extends Error {
  readonly code = "ACCOUNT_IDENTITY_ALREADY_LINKED";
  readonly accountId: string;
  readonly provider: string;
  readonly providerUserId: string;

  constructor(input: { accountId: string; provider: string; providerUserId: string }) {
    super(`${input.provider} identity is already linked to another account`);
    this.name = "AccountIdentityConflictError";
    this.accountId = input.accountId;
    this.provider = input.provider;
    this.providerUserId = input.providerUserId;
  }
}

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

export class AccountNotActiveError extends Error {
  readonly code = "ACCOUNT_NOT_ACTIVE";

  constructor() {
    super("JAOTHUI account is not active");
    this.name = "AccountNotActiveError";
  }
}

export class ReviewerSandboxAccountError extends Error {
  readonly code = "REVIEWER_SANDBOX_ACCOUNT_REQUIRED";

  constructor() {
    super("Reviewer sandbox account is required");
    this.name = "ReviewerSandboxAccountError";
  }
}

const normalizeOptionalString = (value: string | null | undefined) =>
  value ?? null;

const normalizeProvider = (provider: AccountIdentityProvider) => {
  if (
    provider !== LINE_PROVIDER &&
    provider !== APPLE_PROVIDER &&
    provider !== REVIEWER_PROVIDER
  ) {
    throw new Error("Unsupported account identity provider");
  }
  return provider;
};

const normalizeProviderUserId = (providerUserId: string) => {
  const normalized = providerUserId.trim();
  if (!normalized) {
    throw new Error("providerUserId is required");
  }
  return normalized;
};

export const normalizeWalletAddress = (walletAddress: string) => {
  const normalized = walletAddress.trim().toLowerCase();
  if (!normalized) {
    throw new Error("walletAddress is required");
  }
  return normalized;
};

export const requireActiveAccount = async (
  accountId: string,
  client: Pick<AccountServiceClient, "account"> = prisma
) => {
  const normalizedAccountId = accountId.trim();
  if (!normalizedAccountId) {
    throw new AccountNotActiveError();
  }

  const account = await client.account.findUnique({
    where: { id: normalizedAccountId },
  });
  if (!account || account.status !== "ACTIVE") {
    throw new AccountNotActiveError();
  }

  return account;
};

export const requireActiveReviewerSandboxAccount = async (
  accountId: string,
  client: Pick<AccountServiceClient, "account"> = prisma
) => {
  const account = await requireActiveAccount(accountId, client);
  if (account.role !== REVIEWER_SANDBOX_ROLE) {
    throw new ReviewerSandboxAccountError();
  }
  return account;
};

export const findOrCreateAccountIdentity = async (
  input: AccountIdentityInput,
  client: AccountServiceClient = prisma
) => {
  const provider = normalizeProvider(input.provider);
  const providerUserId = normalizeProviderUserId(input.providerUserId);
  const email = normalizeOptionalString(input.email);
  const displayName = normalizeOptionalString(input.displayName);
  const avatarUrl = normalizeOptionalString(input.avatarUrl);
  const accountRole = input.accountRole;

  const identity = await client.accountIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId,
      },
    },
    create: {
      provider,
      providerUserId,
      email,
      displayName,
      avatarUrl,
      account: {
        create: {
          email,
          displayName,
          avatarUrl,
          ...(accountRole ? { role: accountRole } : {}),
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

  if (accountRole && identity.account.role !== accountRole) {
    throw new Error("Reviewer sandbox identity is not isolated");
  }

  return identity.account;
};

/**
 * Creates or reuses the single isolated reviewer identity. Account deletion
 * removes the identity, so a later call creates a fresh sandbox account.
 */
export const findOrCreateReviewerSandboxAccount = async (
  input: { providerUserId: string; displayName?: NullableString },
  client: AccountServiceClient = prisma
) => {
  return findOrCreateAccountIdentity(
    {
      provider: REVIEWER_PROVIDER,
      providerUserId: input.providerUserId,
      displayName: input.displayName ?? "JAOTHUI Reviewer Sandbox",
      email: null,
      avatarUrl: null,
      accountRole: REVIEWER_SANDBOX_ROLE,
    },
    client
  );
};

export const findOrCreateLineAccount = async (
  input: LineAccountInput,
  client: AccountServiceClient = prisma
) => {
  return findOrCreateAccountIdentity(
    {
      ...input,
      provider: LINE_PROVIDER,
    },
    client
  );
};

export const attachIdentityToAccount = async (
  accountId: string,
  input: AccountIdentityInput,
  client: AccountServiceClient = prisma
) => {
  const normalizedAccountId = accountId.trim();
  if (!normalizedAccountId) {
    throw new Error("accountId is required");
  }

  const provider = normalizeProvider(input.provider);
  const providerUserId = normalizeProviderUserId(input.providerUserId);
  const email = normalizeOptionalString(input.email);
  const displayName = normalizeOptionalString(input.displayName);
  const avatarUrl = normalizeOptionalString(input.avatarUrl);

  const account = await client.account.findUnique({
    where: { id: normalizedAccountId },
  });
  if (!account || account.status !== "ACTIVE") {
    throw new AccountNotActiveError();
  }

  const existingIdentity = client.accountIdentity.findUnique
    ? await client.accountIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId,
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
      })
    : null;

  if (existingIdentity) {
    if (existingIdentity.accountId !== normalizedAccountId) {
      throw new AccountIdentityConflictError({
        accountId: existingIdentity.accountId,
        provider,
        providerUserId,
      });
    }

    if (client.accountIdentity.update) {
      const updatedIdentity = await client.accountIdentity.update({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId,
          },
        },
        data: {
          email,
          displayName,
          avatarUrl,
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
      return updatedIdentity.account;
    }

    return existingIdentity.account;
  }

  if (!client.accountIdentity.create) {
    throw new Error("accountIdentity.create is required to attach an identity");
  }

  const identity = await client.accountIdentity.create({
    data: {
      accountId: normalizedAccountId,
      provider,
      providerUserId,
      email,
      displayName,
      avatarUrl,
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
  await requireActiveAccount(accountId, client);
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
  await requireActiveAccount(accountId, client);
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

  if (account.status !== "ACTIVE") {
    return null;
  }

  return {
    account,
    linkedWallet: account.walletLinks[0] ?? null,
  };
};

export type AccountDeletionReceipt = {
  deletedAt: Date;
  deletionPolicyVersion: string;
  removedIdentityCount: number;
  removedWalletLinkCount: number;
};

/**
 * Permanently removes JAOTHUI login and wallet associations while retaining a
 * minimal anonymised Account audit row. This intentionally does not touch the
 * legacy User/registry graph.
 */
export async function softDeleteAccount(
  accountId: string,
  client: AccountDeletionClient = prisma,
  options: { now?: () => Date; policyVersion?: string } = {}
): Promise<AccountDeletionReceipt> {
  const normalizedAccountId = accountId.trim();
  if (!normalizedAccountId) {
    throw new AccountNotActiveError();
  }

  const deletedAt = options.now?.() ?? new Date();
  const deletionPolicyVersion =
    options.policyVersion ?? ACCOUNT_DELETION_POLICY_VERSION;

  return client.$transaction(async (transaction) => {
    const account = await transaction.account.findUnique({
      where: { id: normalizedAccountId },
    });
    if (!account || account.status !== "ACTIVE") {
      throw new AccountNotActiveError();
    }

    const removedWalletLinks = await transaction.walletLink.deleteMany({
      where: { accountId: normalizedAccountId },
    });
    const removedIdentities = await transaction.accountIdentity.deleteMany({
      where: { accountId: normalizedAccountId },
    });
    const deletedAccount = await transaction.account.update({
      where: { id: normalizedAccountId },
      data: {
        status: "DELETED",
        deletedAt,
        deletionPolicyVersion,
        email: null,
        displayName: null,
        avatarUrl: null,
      },
      select: {
        deletedAt: true,
        deletionPolicyVersion: true,
      },
    });

    return {
      deletedAt: deletedAccount.deletedAt ?? deletedAt,
      deletionPolicyVersion:
        deletedAccount.deletionPolicyVersion ?? deletionPolicyVersion,
      removedIdentityCount: removedIdentities.count,
      removedWalletLinkCount: removedWalletLinks.count,
    };
  });
}
