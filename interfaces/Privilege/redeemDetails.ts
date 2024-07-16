export interface RedeemDetail {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  point: number;
  image: string;
}

export type RedeemDetailPreview = Omit<RedeemDetail, "isActive">;
