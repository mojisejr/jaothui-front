import { useContractRead } from "wagmi";
import { contract } from "../contract";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { BigNumber } from "ethers";
import { useState } from "react";

export function useTokenOfOwnerAll() {
  const { walletAddress } = useBitkubNext();
  const [tokens, setTokens] = useState<BigNumber[]>();

  useContractRead({
    ...contract.nft,
    functionName: "tokensOfOwnerAll",
    args: [walletAddress],
    onSuccess(data: BigNumber[]) {
      console.log("tokenOfOwnerAll", data);
      setTokens(data);
    },
  });

  return {
    tokens,
  };
}
