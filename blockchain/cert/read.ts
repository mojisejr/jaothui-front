import { useContractRead } from "wagmi";
import { contract } from "../contract";
import { CertNFTRawType, CertNFTRawData, CertNFTData } from "./interface";

const useGetInfosOf = (owner: string | `0x${string}`) => {
  const { data, isError, isLoading, isSuccess, refetch } = useContractRead({
    abi: contract.cert.abi,
    address: contract.cert.address as `0x${string}`,
    functionName: "getInfosOf",
    args: [owner],
    onSuccess(data: [any[]]) {},
  });

  const meta = data && data!.map((m: any[]) => parseCertRawData(m));

  return {
    infos: meta,
    refetchInfo: refetch,
    infosLoading: isLoading,
    infosError: isError,
    infosSuccess: isSuccess,
  };
};

const parseCertRawData = (data: any[]): CertNFTRawData => {
  return {
    name: data[0],
    microchip: data[1],
    height: data[2],
    motherTokenId: data[3].toString(),
    fatherTokenId: data[4].toString(),
    createdAt: data[5].toString(),
    updatedAt: data[6].toString(),
    tokenUri: data[7],
    locked: data[8],
  };
};

function useGetMetadataOf(_owner: string | `0x${string}`) {
  const information = useContractRead({
    abi: contract.cert.abi,
    address: contract.cert.address as `0x${string}`,
    functionName: "getMetadataOf",
    args: [_owner],
    onSuccess(data: string) {},
  });

  const metadata: CertNFTData[] =
    information.data == undefined ? [] : JSON.parse(information.data!);

  return {
    metadata,
    metaRefetch: information.refetch,
    metaLoading: information.isLoading,
    metaError: information.isError,
    metaSuccess: information.isSuccess,
  };
}

export { useGetInfosOf, useGetMetadataOf };
