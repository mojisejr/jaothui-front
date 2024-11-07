import { viem } from "../viem";
import { contract } from "../../blockchain/contract";

export const getTokenOfOwnerAll = async (owner: string) => {
  const { nft } = contract;

  const result = (await viem.readContract({
    abi: nft.abi,
    address: nft.address,
    functionName: "tokenOfOwnerAll",
    args: [owner],
  })) as bigint[];

  return result;
};
