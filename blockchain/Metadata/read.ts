import { useContractRead } from "wagmi";
import { useAccount } from "wagmi";
import { useState } from "react";
import { contract } from "../contract";

export function useGetMetadataOf() {
  const { address } = useAccount();
  const [data, setData] = useState<any[]>([]);

  useContractRead({
    ...contract.metadata,
    functionName: "getMetadataOf",
    args: [address],
    onSuccess(data: any[]) {
      console.log(data);
      setData(data);
    },
  });
}

export function useGetMetadataByMicrochip(michrocip: string) {
  const [data, setData] = useState<any[]>([]);

  useContractRead({
    ...contract.metadata,
    functionName: "getMetadataByMicrochip",
    args: [michrocip],
    onSuccess(data: any[]) {
      console.log(data);
      setData(data);
    },
  });
}
