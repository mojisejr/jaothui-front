import axios from "axios";
import { baseUrl } from "../config";

interface GetFarmByWalletDTO {
  wallet: string;
}

interface CreateFarmByWalletDTO {
  wallet: string;
}

export const getFarmByWallet = async (input: GetFarmByWalletDTO) => {
  const response = await axios.get(
    `${baseUrl}/${process.env.NEXT_PUBLIC_farm_path}/${input.wallet}`
  );

  return response.data;
};

export const createFarmByWallet = async (input: CreateFarmByWalletDTO) => {
  const response = await axios.post(
    `${baseUrl}/${process.env.NEXT_PUBLIC_farm_path}/${input.wallet}`
  );

  return response.data;
};
