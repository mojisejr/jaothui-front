import { groq } from "next-sanity";
import { client } from "../../sanity/lib/client";
import dayjs from "dayjs";

export const getAllGames = async () => {
  try {
    const query = groq`*[_type == "game" && isActive == true]{
    _id,
    title,
    "type": gameType,
    "image": image.asset->url,
    start,
    end,
    description,
    isActive
    }`;

    const result = await client.fetch<any[]>(query);

    return result;
  } catch (error) {
    console.error;
    return [];
  }
};

export const getNFTInGame = async (
  gameId: string,
  tokenId: string,
  contractAddress: string
) => {
  try {
    const query = groq`*[_type == "nftInGame" && tokenId == "${tokenId}" && contractAddress == "${contractAddress}"][0]`;

    const result = await client.fetch<any>(query);

    if (result == null) {
      await createNewInGameNFT(gameId, tokenId, contractAddress);
      const query = groq`*[_type == "nftInGame" && tokenId == "${tokenId}" && contractAddress == "${contractAddress}"][0]`;
      const result = await client.fetch<any>(query);
      return result;
    }

    return result;
  } catch (error) {
    console.log(error);
  }
};

export const createNewInGameNFT = async (
  gameId: string,
  tokenId: string,
  contractAddress: string
) => {
  const data = {
    _type: "nftInGame",
    contractAddress,
    tokenId,
    exp: 0,
    point: 0,
    level: 1,
    isActive: true,
    game: {
      _type: "game",
      _ref: gameId,
    },
    timestamp: new Date(),
  };

  const result = client.create(data);

  return result;
};

export const resetPointByRound = async (
  gameId: string,
  contractAddress: string
) => {
  const query = groq`*[_type == "game" && _id == "${gameId}"]{
    _id,
    title,
    "type": gameType,
    "image": image.asset->url,
    start,
    end,
    description,
    isActive
  }[0]`;

  const game = await client.fetch<any>(query);

  const canReset = dayjs().isAfter(dayjs(game.end));

  if (canReset) {
    const query = groq`*[_type == "nftInGame" && contractAddress == "${contractAddress}"]`;
    const nfts = await client.fetch<any>(query);

    for (let i = 0; i < nfts.length; i++) {
      await client.patch(nfts[i]._id).set({ point: 0 }).commit();
      // .then((result) => console.log("Done"));
    }

    await client
      .patch(gameId)
      .set({ end: dayjs().add(1, "day").set("minute", 0).toISOString() })
      .commit();

    // console.log("Reset");
  }

  // console.log("Continue");
};

export const pointUpdate = async (docId: string) => {
  const result = await client.patch(docId).inc({ point: 1 }).commit();
  return result.point;
};