import { useEffect } from "react";
import { trpc } from "../utils/trpc";
import { toast } from "react-toastify";

export function useAddAsset() {
  const { mutate, isError, isSuccess, isLoading } =
    trpc.buffalo.create.useMutation();

  useEffect(() => {
    if (isError) {
      toast.error("Add Asset Failed!");
    }

    if (isSuccess) {
      toast.success("Add Asset Successfully!");
    }
  }, [isError, isSuccess]);

  return {
    adding: isLoading,
    added: isSuccess,
    addError: isError,
    newAsset: mutate,
  };
}
