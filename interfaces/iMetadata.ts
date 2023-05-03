export interface IMetadata {
  name: string;
  image?: string;
  edition: number;
  description: string;
  attributes?: Attribute[];
}

export interface Attribute {
  trait_type: string;
  value: any;
}
