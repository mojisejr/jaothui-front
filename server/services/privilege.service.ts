import { RedeemData } from "../../interfaces/Privilege/redeemData";
import { client } from "../../sanity/lib/client";
import { groq } from "next-sanity";

export const getAllPriviledge = async () => {
  try {
    const query = groq`*[_type == "privilege" && isActive == true] {
    _rev,
    description,
    isActive,
    "image": image.asset->url,
    contract,
    options,
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
    options,
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
    const response = await client.create({
      _type: "redemption",
      ...redeemData,
      privilege: {
        _type: "reference",
        _ref: redeemData.privilege,
      },
    });
    console.log(response);
    return response;
  } catch (error) {
    console.log(error);
  }
};
