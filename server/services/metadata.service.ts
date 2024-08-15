import { Address, createPublicClient, http } from "viem";
import { bitkub_mainnet } from "../../blockchain/chain";
import { contract } from "../../blockchain/contract";
import { isCertificateActivated } from "./certificate.service";
import { IMetadata } from "../../interfaces/iMetadata";
import { getImageUrl } from "../supabase";

const viem = createPublicClient({
  chain: bitkub_mainnet,
  transport: http(),
});

export const getAllMetadata = async () => {
  try {
    const metadata = (await viem.readContract({
      address: contract.metadata.address as Address,
      abi: contract.metadata.abi,
      functionName: "getAllMetadata",
    })) as any[];

    const m = await Promise.all(
      metadata.map(async (m, index) => {
        return {
          tokenId: index + 1,
          name: m.name,
          origin: m.origin,
          color: m.color,
          image: getImageUrl(`${(index + 1).toString()}.jpg`),
          detail: m.detail,
          sex: m.sex,
          birthdate: +m.birthdate.toString(),
          birthday: new Date(
            +m.birthdate.toString() * 1000
          ).toLocaleDateString(),
          height: m.height.toString(),
          microchip: m.certify.microchip,
          certNo: m.certify.certNo,
          rarity: m.certify.rarity,
          dna: m.certify.dna,
          fatherId: m.relation.motherTokenId,
          motherId: m.relation.fatherTokenId,
          createdAt: new Date(
            +m.createdAt.toString() * 1000
          ).toLocaleDateString(),
          updatedAt: new Date(
            +m.updatedAt.toString() * 1000
          ).toLocaleDateString(),
        };
      })
    );

    return m as IMetadata[];
  } catch (error) {
    console.log(error);
  }
};

export interface Metadata {
  name: string;
  origin: string;
  color: string;
  imageUri: string;
  detail: string;
  sex: string;
  birthdate: bigint;
  height: bigint;
  certify: {
    microchip: string;
    certNo: string;
    rarity: string;
    dna: string;
    issuedAt: bigint;
  };
  relation: { motherTokenId: string; fatherTokenId: string };
  createdAt: bigint;
  updatedAt: bigint;
  certificate: any;
}

export const getMetadataByMicrochipId = async (
  microchipId: string,
  tokenId: number
) => {
  try {
    const data = (await viem.readContract({
      address: contract.metadata.address as Address,
      abi: contract.metadata.abi,
      functionName: "getMetadataByMicrochip",
      args: [microchipId],
    })) as Metadata;

    const certificationData = await isCertificateActivated(microchipId);

    const parsed = {
      ...data!,
      imageUri: getImageUrl(`${tokenId}.jpg`),
      birthdate: +data.birthdate!.toString(),
      height: +data.height.toString(),
      certify: {
        ...data.certify,
        issuedAt: +data.certify.issuedAt.toString(),
      },
      createdAt: +data.createdAt.toString(),
      updatedAt: +data.updatedAt.toString(),
      certificate: certificationData,
    };

    // console.log(parsed);

    return parsed;
  } catch (error) {
    console.log(error);
  }
};

export const getMetadataByMicrochip = async (microchip: string) => {
  try {
    const metadata = (await viem.readContract({
      address: contract.metadata.address as Address,
      abi: contract.metadata.abi,
      functionName: "getAllMetadata",
    })) as any[];

    const tokenId =
      metadata.map((m) => m.certify.microchip === microchip).indexOf(true) + 1;

    const data = await getMetadataByMicrochipId(microchip, tokenId);
    return { tokenId, ...data };
  } catch (error) {
    console.log(error);
  }
};
