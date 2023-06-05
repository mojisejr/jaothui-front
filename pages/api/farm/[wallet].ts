// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Farm } from "../../../interfaces/MyFarm/iFarm";
import { Asset } from "../../../interfaces/MyFarm/iAsset";

const url =
  process.env.production == "DEV"
    ? process.env.NEXT_PUBLIC_backend_url_dev
    : process.env.NEXT_PUBLIC_backend_url_prod;

type Data = {
  farm: Farm;
  asset: Asset;
};

type Error = {
  error: string;
  errorCode?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
) {
  const query = req.query;
  if (req.method == "GET") {
    const farm = await axios.get(`${url}/farm/${query.wallet}`);
    res.json(farm.data);
  } else if (req.method == "POST") {
    const farm = await axios.post(`${url}/farm/${query.wallet}`);
    res.json(farm.data);
  } else {
    res.json({ error: "error", errorCode: 404 });
  }
}
