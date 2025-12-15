import { isCertificateActivated } from "./certificate.service";
import { IMetadata } from "../../interfaces/iMetadata";
import { getImageUrl } from "../supabase";
import { prisma } from "../prisma";
import { calculateBuffaloAge } from "../../utils/age-calculator";
import dayjs from "dayjs";

export const getAllMetadata = async (nextPage: number) => {
  const page = nextPage <= 1 ? 1 : nextPage;
  const itemsPerPage = 30;
  
  try {
    // ✅ Database-only approach: Single source of truth
    const skip = (page - 1) * itemsPerPage;
    const data = await prisma.pedigree.findMany({
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: itemsPerPage,
    });

    const dataPerPage = data.map((m) => ({
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
  } catch (error) {
    console.error("Error fetching all metadata:", error);
    throw error;
  }
};

export const getMetadataByMicrochip = async (microchip: string) => {
  try {
    // Fetch from database only
    const pedigree = await prisma.pedigree.findUnique({
      where: { microchip },
    });

    if (!pedigree) {
      throw new Error(`Pedigree not found for microchip: ${microchip}`);
    }

    // Get certificate info
    const certificate = await isCertificateActivated(microchip);

    // Build response object with consistent structure
    const out = {
      tokenId: +pedigree.tokenId.toString(),
      name: pedigree.name,
      origin: pedigree.origin ?? "thai",
      color: pedigree.color,
      imageUri: getImageUrl(`${pedigree.tokenId.toString()}.jpg`),
      detail: pedigree.detail,
      sex: pedigree.sex,
      birthdate: new Date(pedigree.birthday).getTime() / 1000,
      height: pedigree.height?.toString() ?? "0",
      certify: {
        microchip: pedigree.microchip,
        certNo: pedigree.certNo ?? "N/A",
        rarity: pedigree.rarity,
        dna: pedigree.dna,
        issuedAt: new Date(pedigree.birthday).getTime() / 1000,
      },
      relation: {
        motherTokenId: pedigree.motherId ?? "",
        fatherTokenId: pedigree.fatherId ?? "",
      },
      createdAt: +pedigree.createdAt,
      updatedAt: +pedigree.updatedAt,
      certificate: certificate || {},
      calculatedAge: calculateBuffaloAge(new Date(pedigree.birthday).getTime()),
    };

    return out;
  } catch (error) {
    console.error("Error fetching metadata by microchip:", error);
    throw error;
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
  // ✅ Robust search with consistent ordering
  const metadata = await prisma.pedigree.findMany({
    where: {
      name: {
        contains: keyword,
        mode: 'insensitive',  // Case-insensitive search
      },
    },
    orderBy: { createdAt: 'desc' },  // Consistent ordering with main list
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
