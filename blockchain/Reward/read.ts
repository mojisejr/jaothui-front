import { useContractRead } from "wagmi";
import { contract } from "../contract";
import { useState } from "react";

export function useGetRewardByMicrochip(microchip: string) {
  const [data, setData] = useState<any>(null);

  useContractRead({
    ...contract.reward,
    functionName: "getRewardByMicrochip",
    args: [microchip],
    onSuccess(data: any) {
      console.log(data);
      setData(data);
    },
  });
}
