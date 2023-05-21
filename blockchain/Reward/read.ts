import { useContractRead } from "wagmi";
import { contract } from "../contract";
import { useState } from "react";
import { BigNumber } from "ethers";
import { RewardData } from "../../interfaces/iReward";

export function useGetRewardByMicrochip(microchip: string) {
  const [data, setData] = useState<RewardData[]>([]);

  useContractRead({
    ...contract.reward,
    functionName: "getRewardByMicrochip",
    // args: [microchip],
    args: ["172645837162534"],
    onSuccess(data: [string, boolean, BigNumber][]) {
      if (data.length > 0) {
        const rewardData: RewardData[] = data.map((r) => {
          return {
            ipfs: r[0],
            active: Boolean(r[1]),
            createdAt: +r[2],
          };
        });
        setData(rewardData);
      }
    },
  });

  return {
    rewards: data,
  };
}
