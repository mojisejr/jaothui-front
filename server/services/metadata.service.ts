import { isCertificateActivated } from "./certificate.service";
import { IMetadata } from "../../interfaces/iMetadata";
import { getImageUrl } from "../supabase";
import { prisma } from "../prisma";
import { calculateBuffaloAge } from "../../utils/age-calculator";
import type { Prisma } from "@prisma/client";
import dayjs from "dayjs";

type AgeOperator = ">" | "<" | ">=" | "<=" | "=";
type SortBy = "latest" | "oldest" | "youngest";

export interface MetadataFilterInput {
  sex?: "all" | "female" | "male";
  color?: "all" | "black" | "albino";
  ageOperator?: AgeOperator;
  ageValue?: string;
  sortBy?: SortBy;
  search?: string;
}

export interface MetadataListInput {
  page: number;
  filter?: MetadataFilterInput;
}

export interface MetadataListResponse {
  items: IMetadata[];
  totalCount: number;
  page: number;
  totalPages: number;
  itemsPerPage: number;
}

const ITEMS_PER_PAGE = 30;
const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

function mapPedigreeToMetadata(m: {
  tokenId: bigint;
  name: string;
  origin: string | null;
  color: string;
  detail: string;
  sex: string;
  birthday: Date;
  height: number | null;
  microchip: string;
  certNo: string | null;
  rarity: string;
  dna: string;
  fatherId: string | null;
  motherId: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    tokenId: +m.tokenId.toString(),
    name: m.name,
    origin: m.origin ?? "thai",
    color: m.color,
    image: getImageUrl(`${m.tokenId.toString()}.jpg`),
    detail: m.detail,
    sex: m.sex,
    birthdate: new Date(m.birthday).getTime(),
    birthday: dayjs(m.birthday).format("DD/MM/YYYY"),
    calculatedAge: calculateBuffaloAge(new Date(m.birthday).getTime()),
    height: m.height?.toString() ?? "0",
    microchip: m.microchip,
    certNo: m.certNo ?? "N/A",
    rarity: m.rarity,
    dna: m.dna,
    fatherId: m.fatherId ?? "N/A",
    motherId: m.motherId ?? "N/A",
    createdAt: new Date(+m.createdAt.toString() * 1000).toLocaleDateString(),
    updatedAt: new Date(+m.updatedAt.toString() * 1000).toLocaleDateString(),
  } satisfies IMetadata;
}

function buildColorWhere(color?: MetadataFilterInput["color"]): Prisma.PedigreeWhereInput | undefined {
  if (!color || color === "all") {
    return undefined;
  }

  if (color === "albino") {
    return {
      OR: [
        { color: { contains: "เผือก", mode: "insensitive" } },
        { color: { contains: "albino", mode: "insensitive" } },
      ],
    };
  }

  if (color === "black") {
    return {
      OR: [
        { color: { contains: "ดำ", mode: "insensitive" } },
        { color: { contains: "black", mode: "insensitive" } },
      ],
    };
  }

  return undefined;
}

function buildBirthdayWhere(
  ageOperator?: MetadataFilterInput["ageOperator"],
  ageValue?: string
): Prisma.DateTimeFilter | undefined {
  const normalizedAgeValue = ageValue?.trim() ?? "";
  if (!normalizedAgeValue.length) {
    return undefined;
  }

  const ageInMonths = Number(normalizedAgeValue);
  if (!Number.isFinite(ageInMonths) || ageInMonths < 0) {
    return undefined;
  }

  const now = Date.now();
  const upperBound = new Date(now - ageInMonths * MONTH_IN_MS);
  const lowerBound = new Date(now - (ageInMonths + 1) * MONTH_IN_MS);

  switch (ageOperator) {
    case ">":
      return { lt: upperBound };
    case "<":
      return { gt: upperBound };
    case "<=":
      return { gte: upperBound };
    case "=":
      return { gt: lowerBound, lte: upperBound };
    case ">=":
    default:
      return { lte: upperBound };
  }
}

function buildOrderBy(
  sortBy?: MetadataFilterInput["sortBy"]
): Prisma.PedigreeOrderByWithRelationInput[] {
  switch (sortBy) {
    case "oldest":
      return [{ birthday: "asc" }, { tokenId: "asc" }];
    case "youngest":
      return [{ birthday: "desc" }, { tokenId: "desc" }];
    case "latest":
    default:
      return [{ createdAt: "desc" }, { tokenId: "desc" }];
  }
}

function buildMetadataWhere(
  filter?: MetadataFilterInput
): Prisma.PedigreeWhereInput {
  if (!filter) {
    return {};
  }

  const andConditions: Prisma.PedigreeWhereInput[] = [];

  if (filter.sex && filter.sex !== "all") {
    andConditions.push({
      sex: {
        equals: filter.sex,
        mode: "insensitive",
      },
    });
  }

  const colorWhere = buildColorWhere(filter.color);
  if (colorWhere) {
    andConditions.push(colorWhere);
  }

  const birthdayWhere = buildBirthdayWhere(filter.ageOperator, filter.ageValue);
  if (birthdayWhere) {
    andConditions.push({ birthday: birthdayWhere });
  }

  const keyword = filter.search?.trim();
  if (keyword) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },
        {
          microchip: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (!andConditions.length) {
    return {};
  }

  return { AND: andConditions };
}

export const getAllMetadata = async ({
  page: nextPage,
  filter,
}: MetadataListInput): Promise<MetadataListResponse> => {
  const page = nextPage <= 1 ? 1 : nextPage;
  const where = buildMetadataWhere(filter);
  const orderBy = buildOrderBy(filter?.sortBy);

  try {
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const [data, totalCount] = await prisma.$transaction([
      prisma.pedigree.findMany({
        where,
        orderBy,
        skip,
        take: ITEMS_PER_PAGE,
      }),
      prisma.pedigree.count({ where }),
    ]);

    return {
      items: data.map(mapPedigreeToMetadata),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
      itemsPerPage: ITEMS_PER_PAGE,
    };
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
      birthdate: new Date(pedigree.birthday).getTime(),
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
    birthdate: new Date(d.birthday).getTime(),
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
    birthdate: new Date(d.birthday).getTime(),
    calculatedAge: calculateBuffaloAge(d.birthday.getTime()),
    tokenId: +d.tokenId.toString(),
    height: d.height?.toString() ?? "0",
    certNo: d.certNo ?? "N/A",
    fatherId: d.fatherId ?? "N/A",
    motherId: d.motherId ?? "N/A",
  }));

  return parsed;
};
