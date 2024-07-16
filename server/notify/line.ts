/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import axios from "axios";
import qs from "qs";

export async function itemRedeemNotify({
  _id,
  item,
  name,
  address,
  tel,
}: {
  _id: string;
  item: string;
  name: string;
  address: string;
  tel: string;
}) {
  try {
    const token = process.env.line as string;
    const response = await axios.post(
      "https://notify-api.line.me/api/notify",
      /*การแจ้งเตือนสมัครสมาชิก✨️
  Wallet :

  ชื่อ : 

  สถานะ : ตลอดชีพ

  กรุณาตรวจสอบการโอนเงิน📍*/
      qs.stringify({
        message: `แจ้งเตือน Redeem Item
        _id: ${_id}

        Item: ${item}
        
        ชื่อ:  ${name}
        
        ที่อยู่: ${address} 

        เบอร์โทร: ${tel} 
        `,
      }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ContentType: "application/x-www-form-urlencoded",
        },
      }
    );
    // console.log("notification response", response);
    return true;
  } catch (error) {
    console.log("notification error: ", error);
  }
}
