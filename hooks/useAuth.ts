import useSWRMutation from "swr/mutation";
import useSwr from "swr";
import { useBitkubNext } from "./bitkubNextContext";
import { get } from "../helpers/get";
import axios from "axios";

export function useAuth() {
  const { walletAddress } = useBitkubNext();

  const { trigger } = useSWRMutation(
    `/api/user/token/refresh`,
    createOrUpdateToken,
    {
      onSuccess(data) {
        console.log(data);
      },
      onError(error) {
        console.log(error);
      },
    }
  );

  const refreshToken = useSwr(`/api/user/token/${walletAddress}`, get);

  return {
    save: trigger,
    refreshToken: refreshToken !== undefined ? refreshToken.data : null,
    getRefreshToken: refreshToken.mutate,
  };
}

async function createOrUpdateToken(
  url: string,
  { arg }: { arg: { wallet: `0x${string}`; refreshToken: string } }
) {
  const result = await axios.post("/api/user/token/refresh", {
    wallet: arg.wallet,
    refreshToken: arg.refreshToken,
  });

  return result;
}
