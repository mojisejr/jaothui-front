import { useBitkubNext } from "../contexts/bitkubNextContext";
import useSwr from "swr";
import { get } from "../helpers/get";
import { FarmData } from "../interfaces/MyFarm/iFarmData";
import { trpc } from "../utils/trpc";

export function useFarm() {
  const { walletAddress } = useBitkubNext();
  const { data, isLoading, isError, isSuccess, refetch } =
    trpc.farm.get.useQuery({ wallet: walletAddress });
  // const { data, isLoading, error, mutate } = useSwr(
  //   `/api/farm/${walletAddress}`,
  //   get,
  //   {
  //     refreshInterval: 3000,
  //     revalidateOnFocus: true,
  //   }
  // );

  return {
    farmData: data as FarmData,
    refetchFarm: refetch,
    isFarmLoading: isLoading,
    isFarmError: isError,
  };
}
