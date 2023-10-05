import { groq } from "next-sanity";
import { client } from "../../sanity/lib/client";
import { Product } from "../../interfaces/Store/Product";

export const getProducts = async () => {
  const query = groq`*[_type == "product"]{
        _id,
        "images": images[].asset->url,
        "slug": slug.current,
        name,
        modelno,
        price,
        discount,
        "desc": desc[]{title, value}
    }`;

  const products = await client.fetch<Product[]>(query);
  return products;
};
