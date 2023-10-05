import { type SchemaTypeDefinition } from "sanity";
import { productType } from "./schema/product";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [productType],
};
