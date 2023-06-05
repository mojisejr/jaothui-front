// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const url =
  process.env.production == "DEV"
    ? process.env.NEXT_PUBLIC_backend_url_dev
    : process.env.NEXT_PUBLIC_backend_url_prod;

type Data = {
  success: boolean;
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

    const data = {
      wallet: body.wallet,
      role: "User",
    };

    console.log("USERDATA", data);

    const user = await axios.post(`${url}/user/`, data);
    res.json({ success: true });
    // res.json(farm.data);
  } else {
    res.json({ error: "error", errorCode: 404 });
  }
}
