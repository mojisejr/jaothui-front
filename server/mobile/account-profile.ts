import type {
  MobileAccountProvider,
  MobileBitkubNextSessionPayload,
  MobileAccountSessionPayload,
  MobileSessionPayload,
} from "./auth-session";
import { toMobileBuffaloCard } from "./view-models";
import { getAccountProfile } from "../services/account.service";
import { getMemberData } from "../services/kwaithai.service";

type LinkedWalletIdentity = {
  walletAddress: string;
  provider: "bitkub-next";
  email: string | null;
};

export type MobileAccountIdentity =
  | {
      sessionVersion: 1;
      provider: "bitkub-next";
      walletAddress: string;
      email: string | null;
    }
  | {
      sessionVersion: 2;
      provider: MobileAccountProvider;
      accountId: string;
      providerUserId: string;
      lineUserId?: string;
      appleUserId?: string;
      email: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      linkedWallet: LinkedWalletIdentity | null;
    };

type MobileMemberSummary = {
  id: number;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
  farmName: string | null;
  role: string;
  statusLabel: string;
};

export type MobileAccountProfile = {
  identity: MobileAccountIdentity;
  member: MobileMemberSummary | null;
  ownedBuffalos: ReturnType<typeof toMobileBuffaloCard>[];
  counts: {
    ownedBuffalos: number;
  };
};

type AccountProfileDependencies = {
  getAccountProfile: typeof getAccountProfile;
  getMemberData: typeof getMemberData;
};

const defaultDependencies: AccountProfileDependencies = {
  getAccountProfile,
  getMemberData,
};

function isBitkubNextSession(
  session: MobileSessionPayload
): session is MobileBitkubNextSessionPayload {
  return "provider" in session && session.provider === "bitkub-next";
}

function toLinkedWalletIdentity(value: unknown): LinkedWalletIdentity | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const wallet = value as {
    walletAddress?: unknown;
    provider?: unknown;
    email?: unknown;
  };

  if (
    typeof wallet.walletAddress !== "string" ||
    wallet.provider !== "bitkub-next"
  ) {
    return null;
  }

  return {
    walletAddress: wallet.walletAddress,
    provider: "bitkub-next",
    email: typeof wallet.email === "string" ? wallet.email : null,
  };
}

function toMemberSummary(
  member: Awaited<ReturnType<typeof getMemberData>>,
  fallbackEmail: string | null
): MobileMemberSummary | null {
  if (!member) {
    return null;
  }

  return {
    id: member.id,
    name: member.name ?? null,
    avatarUrl: member.avatar ?? null,
    email: member.email ?? fallbackEmail,
    farmName: member.farmName ?? null,
    role: member.role,
    statusLabel: member.farmName ? "เจ้าของฟาร์ม" : "สมาชิก",
  };
}

export function toMobileAccountIdentity(
  session: MobileSessionPayload,
  linkedWalletOverride?: LinkedWalletIdentity | null
): MobileAccountIdentity {
  if (isBitkubNextSession(session)) {
    return {
      sessionVersion: 1,
      provider: "bitkub-next",
      walletAddress: session.walletAddress,
      email: session.email,
    };
  }

  return {
    sessionVersion: 2,
    provider: session.primaryProvider,
    accountId: session.accountId,
    providerUserId: session.providerUserId,
    ...(session.primaryProvider === "line" ? { lineUserId: session.providerUserId } : {}),
    ...(session.primaryProvider === "apple" ? { appleUserId: session.providerUserId } : {}),
    email: session.email,
    displayName: session.displayName,
    avatarUrl: session.avatarUrl,
    linkedWallet:
      linkedWalletOverride === undefined
        ? session.linkedWallet
        : linkedWalletOverride,
  };
}

export async function getMobileAccountProfile(
  session: MobileSessionPayload,
  dependencies: AccountProfileDependencies = defaultDependencies
): Promise<MobileAccountProfile> {
  if (isBitkubNextSession(session)) {
    const member = await dependencies.getMemberData(session.walletAddress);
    const ownedBuffalos = member?.Certificate?.map(toMobileBuffaloCard) ?? [];

    return {
      identity: toMobileAccountIdentity(session),
      member: toMemberSummary(member, session.email),
      ownedBuffalos,
      counts: {
        ownedBuffalos: ownedBuffalos.length,
      },
    };
  }

  // Reviewer sessions are intentionally isolated from every legacy member and
  // wallet upstream. Their wallet appearance is provided only by the reviewer
  // fixture endpoint and cannot expose customer data through this profile API.
  if (session.primaryProvider === "reviewer") {
    return {
      identity: toMobileAccountIdentity(session, null),
      member: null,
      ownedBuffalos: [],
      counts: { ownedBuffalos: 0 },
    };
  }

  const accountProfile = await dependencies.getAccountProfile(session.accountId);
  // A v2 JWT may contain a historical wallet snapshot. Only the current
  // database association is authoritative, otherwise a deleted Account could
  // still expose its former wallet until the JWT expires.
  const linkedWallet = toLinkedWalletIdentity(accountProfile?.linkedWallet);

  if (!linkedWallet) {
    return {
      identity: toMobileAccountIdentity(session, null),
      member: null,
      ownedBuffalos: [],
      counts: {
        ownedBuffalos: 0,
      },
    };
  }

  const member = await dependencies.getMemberData(linkedWallet.walletAddress);
  const ownedBuffalos = member?.Certificate?.map(toMobileBuffaloCard) ?? [];

  return {
    identity: toMobileAccountIdentity(session, linkedWallet),
    member: toMemberSummary(member, linkedWallet.email ?? session.email),
    ownedBuffalos,
    counts: {
      ownedBuffalos: ownedBuffalos.length,
    },
  };
}
