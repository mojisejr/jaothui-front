import { useContractRead } from "wagmi";
import { useAccount } from "wagmi";
import { useState } from "react";
import { contract } from "../contract";
import { useBitkubNext } from "../../hooks/bitkubNextContext";
import { parseOutputMetadata } from "./helpers/metadataParser";

export function useGetAllMetadata() {
  const [data, setData] = useState<any[]>([]);

  useContractRead({
    ...contract.metadata,
    functionName: "getAllMetadata",
    // args: [address],
    onSuccess(data: any[]) {
      const parsed = parseOutputMetadata(data);
      console.log(parsed);
      setData(parsed);
    },
  });

  return {
    allMetadata: data,
  };
}

export function useGetMetadataOf() {
  // const { address } = useAccount();
  const { walletAddress } = useBitkubNext();
  const [data, setData] = useState<any[]>([]);

  useContractRead({
    ...contract.metadata,
    functionName: "getMetadataOf",
    // args: [address],
    args: [walletAddress],
    onSuccess(data: any[]) {
      const parsed = parseOutputMetadata(data);
      console.log(parsed);
      setData(parsed);
    },
  });

  return {
    metadataOfOwner: data,
  };
}

export function useGetMetadataByMicrochip(michrocip: string) {
  const [data, setData] = useState<any[]>([]);

  useContractRead({
    ...contract.metadata,
    functionName: "getMetadataByMicrochip",
    args: [michrocip],
    onSuccess(data: any[]) {
      console.log("here");
      console.log(data);
      const parsed = parseOutputMetadata([data]);
      setData(parsed);
    },
  });

  return {
    metadata: data,
  };
}
