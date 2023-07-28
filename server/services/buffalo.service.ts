import axios from "axios";
import { baseUrl } from "../config";

interface createBuffaloByFarmIdDTO {
  microchip: string;
  name: string;
  sex: string;
  height: number;
  color: string;
  details: string | null;
  motherId: string | null;
  fatherId: string | null;
  birthday: string;
}

export const createBuffaloByFarmId = async (
  farmId: number,
  input: createBuffaloByFarmIdDTO
) => {
  const response = await axios.post(
    `${baseUrl}/${process.env.NEXT_PUBLIC_buffalo_path}/${farmId}/`,
    input
  );

  return response.data;
};

export const getBuffaloByMicrochip = async (
  farmId: number,
  microchip: string
) => {
  const response = await axios.get(
    `${baseUrl}/${process.env.NEXT_PUBLIC_buffalo_microchip_path}/${farmId}/${microchip}`
  );

  return response.data;
};

export const markBuffaloAsDead = async (buffaloId: number) => {
  const response = await axios.put(
    `${baseUrl}/${process.env.NEXT_PUBLIC_buffalo_path}/${buffaloId}/dead`
  );
  return response.data;
};

export const markBuffaloAsSold = async (buffaloId: number) => {
  const response = await axios.put(
    `${baseUrl}/${process.env.NEXT_PUBLIC_buffalo_path}/${buffaloId}/sold`
  );
  return response.data;
};

export const markBuffaloAsOvulation = async (
  buffaloId: number,
  timestamp: string
) => {
  const response = await axios.post(
    `${baseUrl}/${process.env.NEXT_PUBLIC_fertilizer_path}/${buffaloId}?ovulation=${timestamp}`
  );

  return response.data;
};

export const markBuffaloAsPregnant = async (
  buffaloId: number,
  timestamp: string
) => {
  console.log(
    `${baseUrl}/${process.env.NEXT_PUBLIC_fertilizer_path}/${buffaloId}/preg?preg=${timestamp}`
  );
  const response = await axios.put(
    `${baseUrl}/${process.env.NEXT_PUBLIC_fertilizer_path}/${buffaloId}/preg?preg=${timestamp}`
  );
  return response.data;
};

export const markBuffaloAsUnpregnant = async (
  buffaloId: number,
  endTimestamp: string
) => {
  const response = await axios.put(
    `${baseUrl}/${process.env.NEXT_PUBLIC_fertilizer_path}/${buffaloId}/unpreg?end=${endTimestamp}`
  );
  return response.data;
};
