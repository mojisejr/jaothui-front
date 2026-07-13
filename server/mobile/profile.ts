import type { MobileBitkubNextSessionPayload } from "./auth-session";
import { toMobileBuffaloCard } from "./view-models";
import { getMemberData } from "../services/kwaithai.service";

export async function getMobileProfile(session: MobileBitkubNextSessionPayload) {
  const member = await getMemberData(session.walletAddress);
  const ownedBuffalos = member?.Certificate?.map(toMobileBuffaloCard) ?? [];

  return {
    identity: {
      walletAddress: session.walletAddress,
      email: session.email,
      provider: session.provider,
    },
    member: member
      ? {
          id: member.id,
          name: member.name ?? null,
          avatarUrl: member.avatar ?? null,
          email: member.email ?? session.email,
          farmName: member.farmName ?? null,
          role: member.role,
          statusLabel: member.farmName ? "เจ้าของฟาร์ม" : "สมาชิก",
        }
      : null,
    ownedBuffalos,
    counts: {
      ownedBuffalos: ownedBuffalos.length,
    },
  };
}
