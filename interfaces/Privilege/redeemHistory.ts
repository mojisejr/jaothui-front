export interface RedeemHistory {
  _id: string;
  name: string;
  address: string;
  tel: string;
  trackingNo?: string;
  trackingName?: string;
  status?: string;
  timestamp: Date;
  wallet: string;
  redeemItem: string;
  redeemedPoint: number;
  redeemedItemName: string;
}

export type RedeemHistoryInput = Omit<
  RedeemHistory,
  "_id" | "trackingNo" | "trackingName"
>;
