import { abiMetadata } from "./Metadata/abi";
import { abiNFT } from "./NFT/abi";
import { abiReward } from "./Reward/abi";

const addresses = {
  nft: "0x6287E9675852de46e90d5f52636d859b312c2e92",
  metadata: "0x50B72Bf0E824d8500D84bd539BE06e33f6124837",
  reward: "0xB7874879259Ee3E5699f6521594b531bA28C70Ea",
};
//history 0x0De3eC4b7bC7846AF4Fd16eeDF8ecaeB118B86E3

export const contract = {
  nft: {
    abi: abiNFT,
    address: addresses.nft as `0x${string}`,
  },
  metadata: {
    abi: abiMetadata,
    address: addresses.metadata as `0x${string}`,
  },

  reward: {
    abi: abiReward,
    address: addresses.reward as `0x${string}`,
  },
};
