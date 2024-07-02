import { Member } from "../../interfaces/Profile/Member";
import { prisma } from "../prisma";
import { getAvatarUrl } from "../supabase";
import { getAllMetadata } from "./metadata.service";

export const getMemberData = async (wallet: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { wallet },
      include: {
        Certificate: { select: { microchip: true } },
      },
    });

    const avatar = getAvatarUrl(user?.avatar!);

    const allMeta = await getAllMetadata();

    const userBuffaloMata =
      user && user?.Certificate.length <= 0
        ? []
        : user?.Certificate.map((cert) => {
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
