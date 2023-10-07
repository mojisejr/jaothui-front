import { groq } from "next-sanity";
import { client } from "../../sanity/lib/client";
import { Product } from "../../interfaces/Store/Product";

export const getProducts = async () => {
  try {
    const query = groq`*[_type == "product"]{
      _id,
      handle,
      "title": title[0].value,
      "subtitle": subtitle[0].value,
      "images": images[].asset->url,
      options,
      description,
      "variants": variants[]->{
        "options": options[]{"value": value[]{value}},
        inventory_quantity, 
        "prices": prices[]{
          amount, 
          currency_code
        }
      }
  }`;

    const products = await client.fetch(query);

    const parsedProducts: Product[] = products.map((product: any) => {
      return {
        _id: product._id,
        images: product.images,
        slug: product.handle,
        name: product.title,
        modelno: product.variants[0].options[1].value[0].value,
        price: product.variants[0].prices[0].amount / 100,
        discount: null,
        desc: [
          {
            title: product.options[0],
            value: product.variants[0].options[0].value[0].value,
          },
        ],
      };
    });

    return parsedProducts;
  } catch (error) {
    console.log(error);
  }
};
