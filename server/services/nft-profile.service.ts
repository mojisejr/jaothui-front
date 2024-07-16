import { viem } from "../viem";
import { contract } from "../../blockchain/contract";
import axios from "axios";
import { JaothuiProfile } from "../../interfaces/JaothuiProfile/JaothuiProfile";

export const getJaothuiProfileAll = async (wallet: string) => {
  try {
    const tokenOfOwnerAll = (await viem.readContract({
      abi: contract.jaothui.abi,
      address: contract.jaothui.address,
      functionName: "tokenOfOwnerAll",
      args: [wallet],
    })) as bigint[];

    const metadata =
      tokenOfOwnerAll && tokenOfOwnerAll.length > 0
        ? ((await Promise.all(
            tokenOfOwnerAll.map(async (token) => {
              const metadata = (await viem.readContract({
                abi: contract.jaothui.abi,
                address: contract.jaothui.address,
                functionName: "tokenURI",
                args: [token],
              })) as string;

              const tokenURI = (await axios.get(metadata)).data;
              return tokenURI;
            })
          )) as JaothuiProfile[])
        : [];
    return metadata;
  } catch (error) {
    console.log(error);
  }
};
