import { useContractRead } from "wagmi";
import { contract } from "../contract";
import { useBitkubNext } from "../../hooks/bitkubNextContext";
import { BigNumber } from "ethers";

export function useTokenOfOwnerAll() {
  const { walletAddress } = useBitkubNext();

  useContractRead({
    ...contract.nft,
    functionName: "tokenOfOwnerAll",
    args: [walletAddress],
    onSuccess(data: BigNumber) {
      console.log(data.toString());
    },
  });
}
