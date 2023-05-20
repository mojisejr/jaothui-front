export interface IMetadata {
  name: string;
  origin: string;
  color: string;
  image?: string;
  detail: string;
  sex: string;
  birthday: string;
  height: string;
  microchip: string;
  certNo: string;
  rarity: string;
  fatherId: string;
  motherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attribute {
  trait_type: string;
  value: any;
}
