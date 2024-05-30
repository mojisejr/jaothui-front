import { Address, createPublicClient, http } from "viem";
import { bitkub_mainnet } from "../../blockchain/chain";
import { contract } from "../../blockchain/contract";
import { isCertificateActivated } from "./certificate.service";
import { IMetadata } from "../../interfaces/iMetadata";

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

    const m = metadata.map((m) => {
      return {
        name: m.name,
        origin: m.origin,
        color: m.color,
        image: m.imageUri,
        detail: m.detail,
        sex: m.sex,
        birthdate: +m.birthdate.toString(),
        birthday: new Date(+m.birthdate.toString() * 1000).toLocaleDateString(),
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
    });
    return m as IMetadata[];
  } catch (error) {
    console.log(error);
  }
};

export const getMetadataByMicrochipId = async (microchipId: string) => {
  try {
    const data: any = await viem.readContract({
      address: contract.metadata.address as Address,
      abi: contract.metadata.abi,
      functionName: "getMetadataByMicrochip",
      args: [microchipId],
    });

    const certificationData = await isCertificateActivated(microchipId);

    const parsed = {
      ...data!,
      birthdate: +data.birthdate!.toString(),
      height: +data.height.toString(),
      "og:image": data.imageUri,
      certify: {
        ...data.certify,
        issuedAt: +data.certify.issuedAt.toString(),
      },
      createdAt: +data.createdAt.toString(),
      updatedAt: +data.updatedAt.toString(),
      certificate: certificationData,
    };

    // console.log(parsed)

    return parsed;
  } catch (error) {
    console.log(error);
  }
};
