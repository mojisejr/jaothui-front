export interface Product {
  _id: string;
  // category: "arttoy" | "semen" | "food";
  images: string[];
  slug: string | null;
  name: string;
  modelno: string;
  price: number;
  discount: number | null;
  desc: ProductAttr[];
}

export interface ProductAttr {
  title: string;
  value: string;
}
