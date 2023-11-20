import { groq } from "next-sanity";
import { client } from "../../sanity/lib/client";
import { Product } from "../../interfaces/Store/Product";

export const getAllProducts = async () => {
  try {
    const query = groq`*[_type == "product" && inStock == true] {
    _id,
    name,
    slug,
    "images": image[].asset->url,
    category,
    attributes,
    price,
    isDiscount,
    disccount,
    inStock
  }`;

    const result = await client.fetch<Product[]>(query);

    return result;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getProductByCategory = async (category: string) => {
  try {
    const query = groq`*[_type == "product" && category == "${category}"]{
    _id,
    name,
    slug,
    "images": images[].asset->url,
    category,
    attributes,
    price,
    isDiscount,
    disccount,
    inStock
  }`;

    const result = await client.fetch<Product[]>(query);
    return result;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getProductById = async (id: string) => {
  try {
    const query = groq`*[_type="product" && _id == "${id}"]{
        _id,
        name,
        slug,
        "images": image[].asset->url,
        category,
        attributes,
        price,
        isDiscount,
        disccount,
        inStock
      }`;
    const result = await client.fetch<Product>(query);
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};
