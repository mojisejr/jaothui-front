import { Product } from "./Product";

export interface CreateOrder {
  stripeIntentId: string;
  wallet: string;
  email: string;
  products: {
    product: Product;
    amount: number;
    subtotal: number;
  };
  shippingAddress: {
    name: string;
    address1: string;
    tambon: string;
    amphoe: string;
    province: string;
    postcode: number;
    phone: string;
  };
  paymentStatus: string;
  shippingStatus: string;
  orderStatus: string;
}

export interface Order {
  _createdAt?: string;
  _id: string;
  stripeIntentId: string;
  wallet: string;
  email: string;
  products: {
    _key?: string;
    product: string;
    amount: number;
    subtotal: number;
  }[];
  shippingAddress: {
    address1: string;
    tambon: string;
    amphoe: string;
    province: string;
    postcode: number;
    phone: string;
  };
  paymentStatus: string;
  shippingStatus: string;
  orderStatus: string;
}
