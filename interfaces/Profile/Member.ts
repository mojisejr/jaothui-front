import { IMetadata } from "../iMetadata";

export interface Member {
  id: number;
  avatar?: string;
  name: string;
  farmName?: string;
  wallet: string;
  address: string;
  province: string;
  lat?: number;
  lon?: number;
  role: "ADMIN" | "USER";
  lineId?: string;
  email: string;
  tel: string;
  active: true;
  approved: string[];
  approvedCount: number;
  createdAt?: string;
  Certificate: IMetadata[];
  updateAt?: string;
}
