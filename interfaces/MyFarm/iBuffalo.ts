import { Fertilization } from "./iFertilization";
export interface Buffalo {
  id?: number;
  microchip: string;
  name: string;
  birthday: Date;
  sex: string;
  fatherId?: number;
  motherId?: number;
  height: number;
  color: string;
  details: string;
  farmId?: number;
  ovulation: boolean;
  dead: boolean;
  pregnant: boolean;
  sold: boolean;
  fertilization?: Fertilization[];
}
