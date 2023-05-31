// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Buffalo } from "../../../../../interfaces/MyFarm/iBuffalo";

const url = "http://localhost:3001";

type Error = {
  error: string;
  errorCode?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffalo | Error>
) {
  const query = req.query;

  if (query && req.method == "GET") {
    const buffalo = await axios.get(
      `${url}/buffalo/id/${query.farmId}/${query.id}`
    );

    const data = buffalo.data;
    res.json({ ...data });
  }

  // res.json(farm.data);
}
