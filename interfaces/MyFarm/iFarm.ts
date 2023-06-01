import { Buffalo } from "./iBuffalo";

export interface Farm {
  id?: number;
  name: string;
  wallet: `0x${string}`;
  address: string;
  lat?: number;
  lon?: number;
  details: string;
  buffalos: Buffalo[];
}
