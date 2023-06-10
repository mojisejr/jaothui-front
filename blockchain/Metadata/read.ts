import { useContractRead } from "wagmi";
import { useAccount } from "wagmi";
import { useState } from "react";
import { contract } from "../contract";
import { useBitkubNext } from "../../hooks/bitkubNextContext";
import { parseOutputMetadata } from "./helpers/metadataParser";
import { IMetadata } from "../../interfaces/iMetadata";
import { parseOutputApproval } from "./helpers/approvedByParser";

export function useGetAllMetadata() {
  const [data, setData] = useState<any[]>([]);

  useContractRead({
    ...contract.metadata,
    functionName: "getAllMetadata",
    // args: [address],
    onSuccess(data: any[]) {
      const parsed = parseOutputMetadata(data);
      // console.log(parsed);
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
  const [data, setData] = useState<IMetadata[]>([]);

  useContractRead({
    ...contract.metadata,
    functionName: "getMetadataOf",
    // args: [address],
    args: [walletAddress],
    onSuccess(data: IMetadata[]) {
      const parsed = parseOutputMetadata(data);
      // console.log(parsed);
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
      // console.log("here");
      const parsed = parseOutputMetadata([data]);
      setData(parsed);
    },
  });

  return {
    metadata: data,
  };
}

export function useGetApprovalDataByMicrochip(microchip: string) {
  const [data, setData] = useState<any[]>([]);

  useContractRead({
    ...contract.metadata,
    functionName: "getApprovedByTokenId",
    args: [microchip, true],
    onSuccess(data: any[]) {
      // console.log("here");
      // console.log(data);
      if (data.length <= 0 || data == undefined) {
        setData([]);
      } else {
        const parsed = parseOutputApproval([data]);
        setData(parsed);
      }
    },
  });

  return {
    approvedBy: data,
  };
}
