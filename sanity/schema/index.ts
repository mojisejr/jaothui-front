import { type SchemaTypeDefinition } from "sanity";
import product from "./product";
import productCollection from "./productCollection";
import productVariant from "./productVariant";
import productVariantOption from "./productVariantOption";
import productVariantPrice from "./productVariantPrice";
import { privilegeType } from "./privilege";
import { RedemptionType } from "./redemption";

// export const schema = [

// ];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    product,
    productCollection,
    productVariant,
    productVariantOption,
    productVariantPrice,
    privilegeType,
    RedemptionType,
  ],
};
