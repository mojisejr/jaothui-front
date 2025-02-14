import { Address, createPublicClient, http } from "viem";
import { bitkub_mainnet } from "../../blockchain/chain";
import { contract } from "../../blockchain/contract";
import { isCertificateActivated } from "./certificate.service";
import { IMetadata } from "../../interfaces/iMetadata";
import { getImageUrl } from "../supabase";
import { prisma } from "../prisma";
import { calculateBuffaloAge } from "../../utils/age-calculator";
import dayjs from "dayjs";

const viem = createPublicClient({
  chain: bitkub_mainnet,
  transport: http(),
});

export const getTotalSupply = async () => {
  const totalSupply = (await viem.readContract({
    address: contract.nft.address,
    abi: contract.nft.abi,
    functionName: "totalSupply",
  })) as bigint;

  return parseInt(totalSupply.toString());
};

export const getAllMetadata = async (nextPage: number) => {
  const totalSupply = await getTotalSupply();
  const page = nextPage <= 1 ? 1 : nextPage;
  const itemsPerPage = 30;
  const endPoint =
    page * itemsPerPage + 1 > totalSupply
      ? totalSupply + 1
      : page * itemsPerPage + 1;
  const startPoint = (page - 1) * itemsPerPage + 1;
  try {
    const data = await prisma.pedigree.findMany();

    const dataPerPage = data.slice(startPoint - 1, endPoint - 1).map((m) => ({
      tokenId: +m.tokenId.toString(),
      name: m.name,
      origin: m.origin,
      color: m.color,
      image: getImageUrl(`${m.tokenId.toString()}.jpg`),
      detail: m.detail,
      sex: m.sex,
      birthdate: new Date(m.birthday).getTime() / 1000,
      birthday: dayjs(m.birthday).format("DD/MM/YYYY"),
      calculatedAge: calculateBuffaloAge(new Date(m.birthday).getTime()),
      height: m.height ?? "0",
      microchip: m.microchip,
      certNo: m.certNo,
      rarity: m.rarity,
      dna: m.dna,
      fatherId: m.fatherId,
      motherId: m.motherId,
      createdAt: new Date(+m.createdAt.toString() * 1000).toLocaleDateString(),
      updatedAt: new Date(+m.updatedAt.toString() * 1000).toLocaleDateString(),
    }));

    return dataPerPage as IMetadata[];

    // try {
    // let metadata: any[] = [];

    // for (let i = startPoint; i < endPoint; i++) {
    //   const result = (await viem.readContract({
    //     address: contract.metadata.address as Address,
    //     abi: contract.metadata.abi,
    //     functionName: "getMetadata",
    //     args: [i],
    //   })) as any[];
    //   metadata.push(result);
    // }

    // const m = await Promise.all(
    //   metadata.map(async (m, index) => {
    //     return {
    //       tokenId: startPoint + index,
    //       name: m.name,
    //       origin: m.origin,
    //       color: m.color,
    //       image: getImageUrl(`${(startPoint + index).toString()}.jpg`),
    //       detail: m.detail,
    //       sex: m.sex,
    //       birthdate: +m.birthdate.toString(),
    //       birthday: new Date(
    //         +m.birthdate.toString() * 1000
    //       ).toLocaleDateString(),
    //       calculatedAge: calculateBuffaloAge(+m.birthdate.toString() * 1000),
    //       height: m.height.toString(),
    //       microchip: m.certify.microchip,
    //       certNo: m.certify.certNo,
    //       rarity: m.certify.rarity,
    //       dna: m.certify.dna,
    //       fatherId: m.relation.motherTokenId,
    //       motherId: m.relation.fatherTokenId,
    //       createdAt: new Date(
    //         +m.createdAt.toString() * 1000
    //       ).toLocaleDateString(),
    //       updatedAt: new Date(
    //         +m.updatedAt.toString() * 1000
    //       ).toLocaleDateString(),
    //     };
    //   })
    // );

    // return m as IMetadata[];
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
  calculatedAge?: number;
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

    return parsed;
  } catch (error) {
    console.log(error);
  }
};

export const getMetadataByMicrochip = async (microchip: string) => {
  try {
    // const metadata = await getAllMetadata(page);
    const result = (await viem.readContract({
      address: contract.metadata.address as Address,
      abi: contract.metadata.abi,
      functionName: "microchipToTokenId",
      args: [microchip],
    })) as bigint;

    const tokenId = parseInt(result.toString());
    // const tokenId =
    //   metadata!.map((m) => m.microchip === microchip).indexOf(true) + 1;

    const data = await getMetadataByMicrochipId(microchip, tokenId);

    const fromDB = await prisma.pedigree.findUnique({
      where: { microchip: microchip },
    });

    const out = {
      tokenId,
      ...data,
      calculatedAge: calculateBuffaloAge(data?.birthdate! * 1000),
      certify: {
        ...data?.certify,
        dna: fromDB?.dna,
      },
      certificate: { ...data?.certificate, approvers: [] },
    };

    return out;
  } catch (error) {
    console.log(error);
  }
};

export const getMetadataBatch = async (microchips: string[]) => {
  const metadata = await prisma.pedigree.findMany({
    where: {
      microchip: {
        in: microchips,
      },
    },
  });

  // console.log(metadata);

  const parsed = metadata.map((d) => ({
    ...d,
    image: `${d.image}.jpg`,
    origin: d.origin ?? "thai",
    birthdate: new Date(d.birthday).getTime() / 1000,
    calculatedAge: calculateBuffaloAge(d.birthday.getTime()),
    tokenId: +d.tokenId.toString(),
    height: d.height?.toString() ?? "0",
    certNo: d.certNo ?? "N/A",
    fatherId: d.fatherId ?? "N/A",
    motherId: d.motherId ?? "N/A",
  }));

  return parsed;
};

// export const getMetadataBatch = async (microchip: string[]) => {
//   let metadata = [];
//   for (let i = 0; i < microchip.length; i++) {
//     const result = await getMetadataByMicrochip(microchip[i]);
//     metadata.push(result);
//   }

//   const m = metadata.map((m, index) => {
//     if (m == undefined) return {};
//     return {
//       tokenId: m.tokenId,
//       name: m.name,
//       origin: m.origin,
//       color: m.color,
//       image: getImageUrl(`${m.tokenId.toString()}.jpg`),
//       detail: m.detail,
//       sex: m.sex,
//       birthdate: +m.birthdate?.toString()!,
//       birthday: new Date(+m.birthdate?.toString()! * 1000).toLocaleDateString(),
//       height: m.height?.toString(),
//       microchip: m.certify?.microchip,
//       certNo: m.certify?.certNo,
//       rarity: m.certify?.rarity,
//       dna: m.certify?.dna,
//       fatherId: m.relation?.motherTokenId,
//       motherId: m.relation?.fatherTokenId,
//       createdAt: new Date(
//         +m.createdAt?.toString()! * 1000
//       ).toLocaleDateString(),
//       updatedAt: new Date(
//         +m.updatedAt?.toString()! * 1000
//       ).toLocaleDateString(),
//     };
//   });

//   return m as IMetadata[];
// };

export const searchByKeyword = async (keyword: string) => {
  const metadata = await prisma.pedigree.findMany({
    where: {
      name: {
        contains: keyword,
      },
    },
  });

  const parsed = metadata.map((d) => ({
    ...d,
    image: `${d.image}.jpg`,
    origin: d.origin ?? "thai",
    birthdate: new Date(d.birthday).getTime() / 1000,
    calculatedAge: calculateBuffaloAge(d.birthday.getTime()),
    tokenId: +d.tokenId.toString(),
    height: d.height?.toString() ?? "0",
    certNo: d.certNo ?? "N/A",
    fatherId: d.fatherId ?? "N/A",
    motherId: d.motherId ?? "N/A",
  }));

  return parsed;
};
