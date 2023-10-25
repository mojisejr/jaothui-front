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
  console.log(_id);
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
    console.log(response);
    return response;
  } catch (error) {
    console.log(error);
  }
};
