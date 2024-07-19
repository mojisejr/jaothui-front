import axios from "axios";
import { baseUrl } from "../config";
import { client } from "../../sanity/lib/client";
import { groq } from "next-sanity";

interface registerUserDTO {
  wallet: string;
  name?: string | null;
  email?: string | null;
  tel?: string | null;
}

export const registerUser = async (data: registerUserDTO) => {
  const response = await axios.post(
    `${baseUrl}/${process.env.NEXT_PUBLIC_register_path}`,
    { ...data, role: "USER" }
  );

  return response.data;
};

export const hasUser = async (wallet: string) => {
  const response = await axios.get(
    `${baseUrl}/${process.env.NEXT_PUBLIC_register_path}/${wallet}/farm`
  );

  const user = response.data;
  if (!user) {
    return false;
  }
  return true;
};

export const updateUserPoint = async (wallet: string, point: number) => {
  try {
    const query = groq`*[_type == "userJaothuiPoint" && wallet == "${wallet}"][0]
    {
    _id,
    currentPoint,
    usedPoint,
    }`;
    const found = await client.fetch<any>(query);

    if (!found) {
      const newUser = {
        _type: "userJaothuiPoint",
        wallet: wallet,
        currentPoint: point,
        usedPoint: 0,
      };
      const created = await client.create(newUser);

      return created;
    } else {
      const result = await client
        .patch(found._id)
        .inc({ currentPoint: point })
        .commit();

      return point;
    }
  } catch (error) {
    console.log(error);
  }
};

export const getJaothuiPointOf = async (wallet: string) => {
  try {
    const query = groq`*[_type == "userJaothuiPoint" && wallet == "${wallet}"]{  _id,
    currentPoint,
    usedPoint,}[0]`;

    const found = await client.fetch<any>(query);
    return found;
  } catch (error) {
    console.log(error);
  }
};
