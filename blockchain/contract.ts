import * as cert from "./cert/abi";
import { abiMetadata } from "./Metadata/abi";
import { abiReward } from "./Reward/abi";

const addresses = {
  cert: "0x5C89E35E2e738c666aa1135f6C0d9036bFbe7846",
  nft: "0x928A4DC25d618cF31BB808Cd1bD8bAb82317D9E7",
  metadata: "0xD1ce4F8935E80B7701F5C151E9c13B16d90ff374",
  reward: "0xB7874879259Ee3E5699f6521594b531bA28C70Ea",
};

export const contract = {
  cert: {
    abi: cert.abi,
    address: addresses.cert,
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
