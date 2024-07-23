import { groq } from "next-sanity";
import { client } from "../../sanity/lib/client";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { updateUserPoint } from "./user.service";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bangkok");

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

  const canReset = dayjs()
    .tz("Asia/Bangkok")
    .isAfter(dayjs(game.end).tz("Asia/Bangkok"));

  if (canReset) {
    const query = groq`*[_type == "nftInGame" && contractAddress == "${contractAddress}"]`;
    const nfts = await client.fetch<any>(query);

    for (let i = 0; i < nfts.length; i++) {
      await client.patch(nfts[i]._id).set({ point: 0 }).commit();
      // .then((result) => console.log("Done"));
    }

    const result = await client
      .patch(gameId)
      .set({
        end: dayjs()
          .add(1, "day")
          .set("hour", 17)
          .set("minute", 0)
          .toISOString(),
      })
      .commit();

    console.log("Reset");
  }

  console.log("Continue");
};

export const pointUpdate = async (docId: string) => {
  const result = await client.patch(docId).inc({ point: 1 }).commit();
  return result.point;
};

export const spin = async (wallet: string) => {
  const point = [0, 1, 0, 3, 5, 1, 7, 3, 10, 3, 7, 1];
  const newPrizeNumber = Math.floor(Math.random() * point.length);
  await updateUserPoint(wallet, point[newPrizeNumber]);

  return { position: newPrizeNumber, result: point[newPrizeNumber] };
};
