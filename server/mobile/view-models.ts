import type { MetadataFilterInput } from "../services/metadata.service";
import type { RewardData } from "../../interfaces/iReward";

type MetadataLike = {
  tokenId?: number;
  name?: string;
  origin?: string;
  color?: string;
  image?: string;
  imageUri?: string;
  detail?: string;
  sex?: string;
  birthdate?: number;
  birthday?: string | Date;
  calculatedAge?: number;
  height?: string;
  microchip?: string;
  certNo?: string;
  rarity?: string;
  dna?: string;
  fatherId?: string;
  motherId?: string;
  certify?: {
    microchip?: string;
    certNo?: string;
    rarity?: string;
    dna?: string;
  };
  relation?: {
    motherTokenId?: string;
    fatherTokenId?: string;
  };
  certificate?: unknown;
};

export type MobileBuffaloCard = {
  tokenId: number | null;
  microchip: string;
  name: string;
  imageUrl: string | null;
  sex: string | null;
  color: string | null;
  birthdate: number | null;
  birthday: string | null;
  ageMonths: number | null;
  certNo: string | null;
  rarity: string | null;
  href: string;
};

export type MobileBuffaloDetail = MobileBuffaloCard & {
  origin: string | null;
  detail: string | null;
  height: string | null;
  dna: string | null;
  fatherId: string | null;
  motherId: string | null;
  certificate: unknown;
  actions: {
    certificate: string;
    rewardDetailTemplate: string;
    share: string;
  };
};

export type MobileReward = {
  id: string;
  microchip: string;
  eventName: string;
  eventDate: string | null;
  rewardName: string;
  rewardImage: string | null;
};

function valueOrNull(value: string | undefined) {
  if (!value || value === "N/A") return null;
  return value;
}

export function toMobileBuffaloCard(item: MetadataLike): MobileBuffaloCard {
  const microchip = item.microchip ?? item.certify?.microchip ?? "";

  return {
    tokenId: typeof item.tokenId === "number" ? item.tokenId : null,
    microchip,
    name: item.name ?? "",
    imageUrl: item.image ?? item.imageUri ?? null,
    sex: item.sex ?? null,
    color: item.color ?? null,
    birthdate: typeof item.birthdate === "number" ? item.birthdate : null,
    birthday:
      typeof item.birthday === "string"
        ? item.birthday
        : item.birthday instanceof Date
          ? item.birthday.toISOString()
          : null,
    ageMonths: typeof item.calculatedAge === "number" ? item.calculatedAge : null,
    certNo: valueOrNull(item.certNo ?? item.certify?.certNo),
    rarity: item.rarity ?? item.certify?.rarity ?? null,
    href: microchip ? `/cert/${microchip}` : "",
  };
}

export function toMobileBuffaloDetail(item: MetadataLike): MobileBuffaloDetail {
  const card = toMobileBuffaloCard(item);

  return {
    ...card,
    origin: item.origin ?? null,
    detail: item.detail ?? null,
    height: item.height ?? null,
    dna: item.dna ?? item.certify?.dna ?? null,
    fatherId: valueOrNull(item.fatherId ?? item.relation?.fatherTokenId),
    motherId: valueOrNull(item.motherId ?? item.relation?.motherTokenId),
    certificate: item.certificate ?? null,
    actions: {
      certificate: `/api/mobile/v1/certs/${card.microchip}/certificate`,
      rewardDetailTemplate: `/api/mobile/v1/certs/${card.microchip}/rewards/:rewardId`,
      share: `/cert/${card.microchip}`,
    },
  };
}

export function toMobileReward(reward: RewardData): MobileReward {
  return {
    id: reward.id,
    microchip: reward.microchip,
    eventName: reward.eventName,
    eventDate: reward.eventDate ?? null,
    rewardName: reward.rewardName,
    rewardImage: reward.rewardImage ?? null,
  };
}

export function normalizeMetadataFilter(query: {
  sex?: string | string[];
  color?: string | string[];
  ageOperator?: string | string[];
  ageValue?: string | string[];
  sortBy?: string | string[];
  search?: string | string[];
}): MetadataFilterInput {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const sex = first(query.sex);
  const color = first(query.color);
  const ageOperator = first(query.ageOperator);
  const sortBy = first(query.sortBy);

  return {
    sex: sex === "female" || sex === "male" ? sex : "all",
    color: color === "black" || color === "albino" ? color : "all",
    ageOperator:
      ageOperator === ">" ||
      ageOperator === "<" ||
      ageOperator === ">=" ||
      ageOperator === "<=" ||
      ageOperator === "="
        ? ageOperator
        : undefined,
    ageValue: first(query.ageValue),
    sortBy: sortBy === "oldest" || sortBy === "youngest" ? sortBy : "latest",
    search: first(query.search),
  };
}
