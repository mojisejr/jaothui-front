import axios from "axios";

export async function getUserData(accessToken: string) {
  try {
    const response = await axios.get(
      "https://api.bitkubnext.io/accounts/auth/info",
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const { wallet_address, email } = response.data.data;
    return {
      wallet_address,
      email,
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
