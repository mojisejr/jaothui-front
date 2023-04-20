import { BigNumber } from "ethers";
export type CertNFTRawType = [
  string,
  string,
  number,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  string,
  boolean
];

export interface CertNFTRawData {
  name: string;
  microchip: string;
  height: number;
  createdAt: string;
  updatedAt: string;
  motherTokenId: string;
  fatherTokenId: string;
  tokenUri: string;
  metadata?: any;
  locked: boolean;
}
