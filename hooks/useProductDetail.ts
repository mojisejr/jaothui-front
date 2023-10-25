import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";
import { useState } from "react";

export const useProductDetail = () => {
  const [product, setProduct] = useState<PricedProduct>();

  return {
    product,
    setProduct,
  };
};
