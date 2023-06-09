// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Buffalo } from "../../../../../interfaces/MyFarm/iBuffalo";

const url =
  process.env.production == "DEV"
    ? process.env.NEXT_PUBLIC_backend_url_dev
    : process.env.NEXT_PUBLIC_backend_url_prod;

type Error = {
  error: string;
  errorCode?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffalo | Error>
) {
  const query = req.query;

  if (query && req.method == "PUT") {
    console.log(query);
    const buffalo = await axios.put(
      `${url}/fertilize/${query.buffaloId}/unpreg?end=${query.end}`
    );

    const data = buffalo.data;
    res.json({ ...data });
  }

  // res.json(farm.data);
}
