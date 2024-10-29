import { prisma } from "../prisma";

export const getAllPathParams = async () => {
  const results = await prisma.pedigree.findMany({
    select: {
      microchip: true,
    },
  });
  const params = results.map(({ microchip }) => ({ params: { microchip } }));

  return params;
};

export const getSEOMetadata = async (microchip: string) => {
  const result = await prisma.pedigree.findFirst({ where: { microchip } });
  const title =
    "ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’";

  if (!result) return null;
  const image = `https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/buffalo/${result.tokenId}.jpg`;

  const metadata = {
    title: `${result.name} #${result.microchip}`,
    description: title,
    ogUrl: `https://jaothui.com/cert/${result.microchip}`,
    ogImage: image,

    ogTwitterTitle: result.name,
    ogTwitterDescription: title,
    ogTwitterImage: image,
  };

  return metadata;
};
