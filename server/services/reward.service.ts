import { RewardData } from "../../interfaces/iReward";
import { prisma } from "../prisma";

export async function readRewardsByMicrochip(microchip: string) {
  const rows = await prisma.reward.findMany({ where: { microchip } });
  return rows.map((row) => ({ ...row, eventDate: row.eventDate?.toDateString() }));
}

export const gerRewardByMicrochip = async (microchip: string) => {
  try {
    return await readRewardsByMicrochip(microchip);
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
