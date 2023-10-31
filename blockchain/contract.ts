import { jaothuiNFTabi } from "./JaothuiNFT/abi";
import { abiMetadata } from "./Metadata/abi";
import { abiNFT } from "./NFT/abi";
import { abiReward } from "./Reward/abi";

const addresses = {
  // nft: "0x6287E9675852de46e90d5f52636d859b312c2e92",
  // // metadata: "0x50B72Bf0E824d8500D84bd539BE06e33f6124837",
  // metadata: "0x2c7CA2FD6eFae81Ed47142EAE016c7885a089840", // V2
  // reward: "0xB7874879259Ee3E5699f6521594b531bA28C70Ea",
  // //Mainnet
  jaothui: "0x07B2bCc269B100b51AB8598d44AB568C7199C7BC",
  nft: "0x0311EfE7C66DBcf7A3340129AFfa7db24B98C194",
  metadata: "0x41f291b116459aE967bCd616F64e762f8468Ea0E",
  // metadata: "0x0311EfE7C66DBcf7A3340129AFfa7db24B98C194", //V1
  reward: "0x09434F0360adc608f947408DB0ac2dFd329DCA8d",
};
//history 0x0De3eC4b7bC7846AF4Fd16eeDF8ecaeB118B86E3

export const contract = {
  jaothui: {
    abi: jaothuiNFTabi,
    address: addresses.jaothui as `0x${string}`,
  },
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
