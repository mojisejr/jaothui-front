import axios from "axios";
export const getCertificateImageOf = async (
  microchip: string,
  tokenId: string
) => {
  const response = await axios
    .get(`${process.env.renderer_url!}/${microchip}/${tokenId}`, {
      // .get(`http://localhost:4444/certificate/${microchip}`, {
      headers: {
        Authorization: `Bearer ${process.env.renderer_key}`,
      },
    })
    .catch((error) => {
      console.log(error);
    });

  if (!response) return;

  return response.data.data;
};
