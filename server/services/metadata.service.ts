import { Address, createPublicClient, http } from "viem";
import { bitkub_mainnet } from "../../blockchain/chain";
import { contract } from "../../blockchain/contract";
import { isCertificateActivated } from "./certificate.service";

const viem = createPublicClient({
  chain: bitkub_mainnet,
  transport: http(),
});

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
      isFull: certificationData.isFull,
      no: certificationData.no,
      year: certificationData.year,
      bornAt: certificationData.bornAt,
      owner: certificationData.owner,
    };

    return parsed;
  } catch (error) {
    console.log(error);
  }
};
