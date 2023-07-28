import axios from "axios";
import { baseUrl } from "../config";

interface registerUserDTO {
  wallet: string;
  name?: string | null;
  email?: string | null;
  tel?: string | null;
}

export const registerUser = async (data: registerUserDTO) => {
  const response = await axios.post(
    `${baseUrl}/${process.env.NEXT_PUBLIC_register_path}`,
    { ...data, role: "USER" }
  );

  return response.data;
};

export const hasUser = async (wallet: string) => {
  const response = await axios.get(
    `${baseUrl}/${process.env.NEXT_PUBLIC_register_path}/${wallet}/farm`
  );

  const user = response.data;
  if (!user) {
    return false;
  }
  return true;
};
