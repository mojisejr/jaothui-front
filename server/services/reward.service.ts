import { prisma } from "../prisma";

export const gerRewardByMicrochip = async (microchip: string) => {
  try {
    const found = await prisma.reward.findMany({ where: { microchip } });
    if (!found) return [];
    return found;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getRewardById = async (id: string) => {
  try {
    const found = await prisma.reward.findFirst({ where: { id } });
    return found;
  } catch (error) {
    console.log(error);
  }
};
