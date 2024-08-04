export interface JaothuiProfile {
  tokenId?: string;
  name: string;
  description: string;
  image: string;
  thumbnail_image: string;
  attributes: { trait_type: string; value: string }[];
  hashtags: string[];
}
