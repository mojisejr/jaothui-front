import { useContractRead } from "wagmi";
import { contract } from "../contract";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { BigNumber } from "ethers";
import { useState } from "react";

export function useGetJaothui() {
  const { walletAddress } = useBitkubNext();
  const [tokens, setTokens] = useState<string[]>();

  const { isLoading, isSuccess } = useContractRead({
    ...contract.jaothui,
    functionName: "tokenOfOwnerAll",
    args: [walletAddress],
    onSuccess(data: BigNumber[]) {
      setTokens(data.map((d) => d.toString()));
    },
  });

  return {
    tokens,
    loadingTokens: isLoading,
    tokensLoaded: isSuccess,
  };
}
