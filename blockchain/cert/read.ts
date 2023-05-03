import { useContractRead } from "wagmi";
import { contract } from "../contract";
import { IMetadata } from "../../interfaces/iMetadata";

function useGetMetadataOf(_owner: string | `0x${string}`) {
  const information = useContractRead({
    abi: contract.cert.abi,
    address: contract.cert.address as `0x${string}`,
    functionName: "getMetadataOf",
    args: [_owner],
    onSuccess(data: string) {},
  });

  const metadata: IMetadata[] =
    information.data == undefined ? [] : JSON.parse(information.data!);

  return {
    metadata,
    metaRefetch: information.refetch,
    metaLoading: information.isLoading,
    metaError: information.isError,
    metaSuccess: information.isSuccess,
  };
}

function useGetMetadataByMicrochip(michrocip: string) {
  const information = useContractRead({
    abi: contract.cert.abi,
    address: contract.cert.address as `0x${string}`,
    functionName: "getMetadataByMicrochip",
    args: [michrocip],
    onSuccess(data: string) {},
  });

  const metadata: IMetadata =
    information.data == undefined ? null : JSON.parse(information.data!);

  return {
    metadata,
    metaRefetch: information.refetch,
    metaLoading: information.isLoading,
    metaError: information.isError,
    metaSuccess: information.isSuccess,
  };
}

export { useGetMetadataOf, useGetMetadataByMicrochip };
