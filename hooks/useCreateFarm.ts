import { useBitkubNext } from "./bitkubNextContext";
import useSWRMutation from "swr/mutation";
import axios from "axios";
import { isEmpty } from "../helpers/dataValidator";
import { toast } from "react-toastify";

export function useCreateFarm() {
  const { walletAddress } = useBitkubNext();
  const { trigger } = useSWRMutation(
    `/api/farm/${walletAddress}`,
    createUserAndFarm,
    {
      onSuccess(data) {
        toast.success("Farm Created Successfully");
      },
      onError(err) {
        toast.error("Create Farm Failed!");
      },
      revalidate: true,
    }
  );

  return {
    create: trigger,
  };
}

async function createUserAndFarm(url: string, { arg }: { arg: string }) {
  const user = await axios.post("/api/user/register", {
    wallet: arg,
  });

  if (!isEmpty(user)) {
    const farm = await axios.post(`/api/farm/${arg}`);
  }
}
