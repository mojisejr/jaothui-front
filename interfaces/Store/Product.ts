export interface Product {
  _id: string;
  name: string;
  slug: string | null;
  images: string[];
  category: string;
  attributes: ProductAttr[];
  price: number;
  isDiscount: boolean;
  discount: number | null;
  inStock: boolean;
  description?: string;
}

export interface ProductAttr {
  title: string;
  value: string;
}
