// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios, { Axios, AxiosResponse } from "axios";

const url =
  process.env.production == "DEV"
    ? process.env.NEXT_PUBLIC_backend_url_dev
    : process.env.NEXT_PUBLIC_backend_url_prod;

type Data = {
  wallet: string;
  refreshToken: string;
};

type Error = {
  error: string;
  errorCode?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
) {
  if (req.method == "POST") {
    const body = req.body;
    const result = await axios.post<any, AxiosResponse<Data>>(
      `${url}/auth`,
      body
    );
    const userData = result.data;
    res.json(userData);
  } else if (req.method == "GET") {
    const body = req.body;
    const result = await axios.get<any, AxiosResponse<Data>>(
      `${url}/auth/${body.wallet}`
    );
    const userData = result.data;
    res.json(userData);
  } else if (req.method == "DELETE") {
    const body = req.body;
    const result = await axios.delete<any, AxiosResponse<Data>>(
      `${url}/auth/${body.wallet}`
    );
    const userData = result.data;
    res.json(userData);
  } else {
    res.json({ error: "Bad Request", errorCode: 403 });
  }
}
