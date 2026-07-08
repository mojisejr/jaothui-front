import { renderPedigree } from "../renderer";
import {
  getAllMetadata,
  getMetadataBatch,
  getMetadataByMicrochip,
} from "../services/metadata.service";
import { gerRewardByMicrochip, getRewardById } from "../services/reward.service";
import { FEATURED_MICROCHIPS, MOBILE_HOME_STATS } from "./constants";
import {
  normalizeMetadataFilter,
  toMobileBuffaloCard,
  toMobileBuffaloDetail,
  toMobileReward,
} from "./view-models";

export async function getMobileFeaturedBuffalos() {
  const featured = await getMetadataBatch([...FEATURED_MICROCHIPS]);
  return featured.map(toMobileBuffaloCard);
}

export async function getMobileHome() {
  return {
    hero: {
      title: "JAOTHUI",
      subtitle: "Thai Buffalo Platform",
      primaryAction: { label: "ค้นหาควาย", href: "/v2/buffalo" },
    },
    stats: MOBILE_HOME_STATS,
    featured: await getMobileFeaturedBuffalos(),
  };
}

export async function getMobileBuffalos(query: {
  page?: string | string[];
  sex?: string | string[];
  color?: string | string[];
  ageOperator?: string | string[];
  ageValue?: string | string[];
  sortBy?: string | string[];
  search?: string | string[];
}) {
  const page = Number(Array.isArray(query.page) ? query.page[0] : query.page);
  const result = await getAllMetadata({
    page: Number.isInteger(page) && page > 0 ? page : 1,
    filter: normalizeMetadataFilter(query),
  });

  return {
    items: result.items.map(toMobileBuffaloCard),
    pagination: {
      page: result.page,
      totalPages: result.totalPages,
      totalCount: result.totalCount,
      itemsPerPage: result.itemsPerPage,
    },
  };
}

export async function getMobileCertDetail(microchip: string) {
  const detail = await getMetadataByMicrochip(microchip);
  const rewards = await gerRewardByMicrochip(microchip);

  return {
    buffalo: toMobileBuffaloDetail(detail),
    rewards: rewards.map(toMobileReward),
  };
}

export async function getMobileCertificate(microchip: string) {
  const detail = await getMetadataByMicrochip(microchip);
  const tokenId = detail.tokenId?.toString();

  if (!tokenId) return null;

  const imageBase64 = await renderPedigree(microchip, tokenId);
  if (!imageBase64) return null;

  return {
    microchip,
    tokenId,
    mimeType: "image/jpeg",
    encoding: "base64",
    imageBase64,
  };
}

export async function getMobileRewardDetail(microchip: string, rewardId: string) {
  const reward = await getRewardById(rewardId);
  if (!reward || reward.microchip !== microchip) return null;
  return toMobileReward(reward);
}

export function isNotFoundError(error: unknown) {
  return error instanceof Error && /not found/i.test(error.message);
}
