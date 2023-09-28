export interface Product {
  _id: string;
  // category: "arttoy" | "semen" | "food";
  images: string[];
  slug?: string;
  name: string;
  modelno: string;
  price: number;
  discount?: number;
  desc: ProductAttr[];
}

export interface ProductAttr {
  title: string;
  value: string;
}
