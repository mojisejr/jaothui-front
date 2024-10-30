import { RewardData } from "../../interfaces/iReward";
import { prisma } from "../prisma";

export const gerRewardByMicrochip = async (microchip: string) => {
  try {
    const found = await prisma.reward.findMany({ where: { microchip } });
    if (!found) return [];
    return found.map((i) => ({ ...i, eventDate: i.eventDate?.toDateString() }));
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getRewardById = async (id: string) => {
  try {
    const found = await prisma.reward.findFirst({ where: { id } });
    return {
      ...found,
      eventDate: found?.eventDate?.toDateString(),
    } as RewardData;
  } catch (error) {
    console.log(error);
  }
};
