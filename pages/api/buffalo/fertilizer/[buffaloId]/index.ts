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

  if (query && req.method == "POST") {
    const buffalo = await axios.post(
      `${url}/fertilize/${query.buffaloId}?ovulation=${query.ovulation}`
    );

    const data = buffalo.data;
    res.json({ ...data });
  }

  // res.json(farm.data);
}
