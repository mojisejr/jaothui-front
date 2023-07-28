import { useBitkubNext } from "../contexts/bitkubNextContext";
import useSWRMutation from "swr/mutation";
import axios from "axios";
import { isEmpty } from "../helpers/dataValidator";
import { toast } from "react-toastify";
import { trpc } from "../utils/trpc";
import { useEffect } from "react";
import { useFarm } from "./useFarm";

export function useCreateFarm() {
  const { mutate, isError, isSuccess, isLoading, error } =
    trpc.farm.create.useMutation();
  const { refetchFarm } = useFarm();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Farm Created Successfully");
      void refetchFarm();
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
    farmCreating: isLoading,
    farmCreated: isSuccess,
    farmCreationError: isError,
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
