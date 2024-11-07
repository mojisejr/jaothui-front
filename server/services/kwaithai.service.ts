import { IMetadata } from "../../interfaces/iMetadata";
import { Member } from "../../interfaces/Profile/Member";
import { prisma } from "../prisma";
import { getAvatarUrl } from "../supabase";
import { getAllMetadata } from "./metadata.service";
import { getTokenOfOwnerAll } from "./nft-pedigree.service";

export const getMemberData = async (wallet: string) => {
  try {
    //GET USER DATA
    const user = await prisma.user.findUnique({
      where: { wallet },
      // where: { wallet: "0x0f454775C7833A624C7b981cf9671806Fc880E30" },
    });

    //GET TOKENS
    const tokens = await getTokenOfOwnerAll(
      wallet
      // "0xD0fBB6E65B81bafe6dd6ea112ca7154368683C7C"
    );

    //GET INFO
    const response = await prisma.pedigree.findMany({
      where: { tokenId: { in: tokens } },
    });

    const buffalos = response.map((m) => {
      return {
        tokenId: parseInt(m.tokenId.toString()),
        name: m.name,
        origin: m.origin ?? "N/A",
        color: m.color,
        image: `${m.image!}.jpg`,
        detail: m.detail,
        sex: m.sex,
        birthdate: m.birthday.getTime(),
        birthday: m.birthday.toDateString(),
        height: m.height?.toString() ?? "0",
        microchip: m.microchip,
        certNo: m.certNo ?? "N/A",
        dna: m.dna,
        rarity: m.rarity,
        fatherId: m.fatherId ?? "N/A",
        motherId: m.motherId ?? "N/A",
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    });

    //PARSE INFO

    // const certificates = user
    //   ? await prisma.certificate.findMany({ where: { ownerName: user.name! } })
    //   : [];

    const avatar = getAvatarUrl(user?.avatar!);

    // const allMeta = await getAllMetadata();

    // const userBuffaloMata =
    //   user && certificates.length <= 0
    //     ? []
    //     : certificates.map((cert) => {
    //         const found = allMeta?.find(
    //           (meta) => meta.microchip == cert.microchip
    //         );

    //         if (found) {
    //           return found;
    //         }
    //       });

    // const output = { ...user, avatar, Certificate: userBuffaloMata };
    const output = { ...user, avatar, Certificate: buffalos };

    return user == null ? null : (output as Member | null);
    // return undefined;
  } catch (error) {
    console.log(error);
    return null;
  }
};
