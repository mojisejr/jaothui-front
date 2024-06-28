import { Member } from "../../interfaces/Profile/Member";
import { prisma } from "../prisma";
import { getAvatarUrl } from "../supabase";

export const getMemberData = async (wallet: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { wallet } });

    const avatar = getAvatarUrl(user?.avatar!);

    const output = { ...user, avatar };

    return output as Member;
  } catch (error) {
    console.log(error);
  }
};
