import { useBitkubNext } from "../contexts/bitkubNextContext";
import useSWRMutation from "swr/mutation";
import axios from "axios";
import { isEmpty } from "../helpers/dataValidator";
import { toast } from "react-toastify";
import { trpc } from "../utils/trpc";
import { useEffect } from "react";

export function useCreateFarm() {
  const { mutate, isError, isSuccess } = trpc.farm.create.useMutation();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Farm Created Successfully");
    }

    if (isError) {
      toast.error("Create Farm Failed!");
    }
  }, [isError, isSuccess]);
  // const { trigger } = useSWRMutation(
  //   `/api/farm/${walletAddress}`,
  //   createUserAndFarm,
  //   {
  //     onSuccess(data) {
  //       toast.success("Farm Created Successfully");
  //     },
  //     onError(err) {
  //       toast.error("Create Farm Failed!");
  //     },
  //     revalidate: true,
  //   }
  // );

  return {
    create: mutate,
  };
}

// async function createUserAndFarm(url: string, { arg }: { arg: string }) {
//   const user = await axios.post("/api/user/register", {
//     wallet: arg,
//   });

//   if (!isEmpty(user)) {
//     const farm = await axios.post(`/api/farm/${arg}`);
//   }
// }
