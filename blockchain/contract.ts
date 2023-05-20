import { abiMetadata } from "./Metadata/abi";
import { abiNFT } from "./NFT/abi";
import { abiReward } from "./Reward/abi";

const addresses = {
  nft: "0x6287E9675852de46e90d5f52636d859b312c2e92",
  metadata: "0xD1ce4F8935E80B7701F5C151E9c13B16d90ff374",
  reward: "0xB7874879259Ee3E5699f6521594b531bA28C70Ea",
};

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
