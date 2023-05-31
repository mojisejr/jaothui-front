import { useBitkubNext } from "./bitkubNextContext";
import useSwr from "swr";
import { get } from "../helpers/get";
import { FarmData } from "../interfaces/MyFarm/iFarmData";

export function useFarm() {
  const { walletAddress } = useBitkubNext();
  const { data, isLoading, error, mutate } = useSwr(
    `/api/farm/${walletAddress}`,
    get,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
    }
  );

  return {
    farmData: data as FarmData,
    refetchFarm: mutate,
    isFarmLoading: isLoading,
    isFarmError: error,
  };
}
