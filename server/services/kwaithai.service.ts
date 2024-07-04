import { Member } from "../../interfaces/Profile/Member";
import { prisma } from "../prisma";
import { getAvatarUrl } from "../supabase";
import { getAllMetadata } from "./metadata.service";

export const getMemberData = async (wallet: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { wallet },
      // where: { wallet: "0x0f454775C7833A624C7b981cf9671806Fc880E30" },
    });

    const certificates = user
      ? await prisma.certificate.findMany({ where: { ownerName: user.name! } })
      : [];

    console.log("ownerName: ", user?.name);

    console.log("cert: ", certificates);

    const avatar = getAvatarUrl(user?.avatar!);

    const allMeta = await getAllMetadata();

    const userBuffaloMata =
      user && certificates.length <= 0
        ? []
        : certificates.map((cert) => {
            const found = allMeta?.find(
              (meta) => meta.microchip == cert.microchip
            );

            if (found) {
              return found;
            }
          });

    const output = { ...user, avatar, Certificate: userBuffaloMata };

    return output as Member;
  } catch (error) {
    console.log(error);
  }
};
