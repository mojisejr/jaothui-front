import { RedeemData } from "../../interfaces/Privilege/redeemData";
import { client } from "../../sanity/lib/client";
import { groq } from "next-sanity";
import { RedeemDetail } from "../../interfaces/Privilege/redeemDetails";
import { RedeemHistoryInput } from "../../interfaces/Privilege/redeemHistory";
import { itemRedeemNotify } from "../notify/line";

export const getAllPriviledge = async () => {
  try {
    const query = groq`*[_type == "privilege" && isActive == true] {
    _rev,
    description,
    isActive,
    "image": image.asset->url,
    contract,
    "options": options[]{"image": image.asset->url, option},
    start,
    type,
    _id,
    name,
    end,
}`;
    const response = await client.fetch(query);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getPrivilegeById = async (_id: string) => {
  try {
    const query = groq`*[_type == "privilege" && isActive == true && _id == "${_id}"] {
    _rev,
    description,
    isActive,
    "image": image.asset->url,
    contract,
    "options": options[]{"image": image.asset->url, option},
    start,
    type,
    _id,
    name,
    end,
    }`;

    const response = await client.fetch(query);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getRedeemedTokenByWallet = async (
  wallet: string,
  privilegeId: string
) => {
  try {
    const query = groq`*[_type == "redemption" && wallet == "${wallet}" && privilege._ref == "${privilegeId}"] {
      tokenId
    }`;

    const response = await client.fetch(query);

    const tokens = response.map((t: any) => t.tokenId);

    return tokens;
  } catch (error) {
    console.log(error);
  }
};

export const saveRedeemData = async (redeemData: RedeemData) => {
  try {
    const query = groq`*[_type == "redemption" && privilege._ref == "${redeemData.privilege}" && tokenId == "${redeemData.tokenId}"]`;
    const isExisted = await client.fetch(query);

    if (isExisted.length <= 0) {
      const response = await client.create({
        _type: "redemption",
        ...redeemData,
        privilege: {
          _type: "reference",
          _ref: redeemData.privilege,
        },
      });
      return response;
    }
  } catch (error) {
    console.log(error);
  }
};

export const getAllJaothuiRedeemItems = async () => {
  const query = groq`*[_type == "jaothuiRedeemItem" && isActive == true]{
    _id,
    name,
    description,
    isActive,
    point,
    "image": image.asset->url
    }`;

  const result = await client.fetch<RedeemDetail[]>(query);

  return result;
};

export const redeemHistoryCreate = async (input: RedeemHistoryInput) => {
  try {
    const query = groq`*[_type == "userJaothuiPoint" && wallet == "${input.wallet}"]{_id}[0]`;
    const found = await client.fetch<any>(query);

    if (!found) return;
    const newReedeemData = {
      _type: "jaothuiRedeemHistory",
      name: input.name,
      address: input.address,
      tel: input.tel,
      status: "redeemed",
      timestamp: input.timestamp,
      wallet: {
        _type: "useJaothuiPoint",
        _ref: found._id,
      },
      redeemedItem: {
        _type: "jaothuiRedeemItem",
        _ref: input.redeemItem,
      },
      redeemedPoint: input.redeemedPoint,
    };

    const result = await client.create(newReedeemData);

    if (result != null) {
      await client
        .patch(found._id)
        .dec({ currentPoint: input.redeemedPoint })
        .inc({ usedPoint: input.redeemedPoint })
        .setIfMissing({ redeemHistory: [] })
        .insert("after", "redeemHistory[-1]", [
          { _type: "reference", _ref: result._id },
        ])
        .commit({ autoGenerateArrayKeys: true });

      await itemRedeemNotify({
        _id: result._id,
        item: input.redeemedItemName,
        name: input.name,
        address: input.address,
        tel: input.tel,
      });
      return result._id;
    }
  } catch (error) {
    console.log(error);
  }
};
