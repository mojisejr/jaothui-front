import axios from "axios";
import { baseUrl } from "../config";

interface registerUserDTO {
  wallet: string;
  name?: string | null;
  tel?: string | null;
}

export const registerUser = async (data: registerUserDTO) => {
  const response = await axios.post(
    `${baseUrl}/${process.env.register_path}`,
    data
  );

  return response.data;
};
