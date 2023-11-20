import { type SchemaTypeDefinition } from "sanity";
import { productType } from "./product";
import { privilegeType } from "./privilege";
import { RedemptionType } from "./redemption";
import { orderType } from "./order";

// export const schema = [

// ];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [productType, orderType, privilegeType, RedemptionType],
};
