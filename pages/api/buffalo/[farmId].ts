// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { isEmpty } from "../../../helpers/dataValidator";

const url = "http://localhost:3001";

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
    const query = req.query;

    const data = {
      microchip: body.id,
      name: body.name,
      sex: body.sex,
      height: +body.height,
      color: body.color,
      details: body.detail,
      motherId: isEmpty(body.motherId) ? null : +body.motherId,
      fatherId: isEmpty(body.fatherId) ? null : +body.fatherId,
      birthday: new Date(body.birthday).toISOString(),
    };


    const buffalo = await axios.post(`${url}/buffalo/${query.farmId}/`, data);
    res.json({ success: true });
    // res.json(farm.data);
  } else {
    res.json({ error: "error", errorCode: 404 });
  }
}
