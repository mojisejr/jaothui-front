export interface JaothuiProfile {
  name: string;
  description: string;
  image: string;
  thumbnail_image: string;
  attributes: { trait_type: string; value: string }[];
  hashtags: string[];
}
