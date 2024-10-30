import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const handler = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get("tokenId");
  if (!tokenId) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            textAlign: "center",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Jaothui.com
        </div>
      ),
      {
        width: 1200,
        height: 600,
      }
    );
  } else {
    const baseUrl =
      "https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/buffalo/";
    return new ImageResponse(
      <img src={`${baseUrl}${tokenId}.jpg`} alt={tokenId} />,
      { width: 1200, height: 600 }
    );
  }

  // if (req.method == "GET") {
  //   console.log(req.query);
  //   return new Response(`microchip: `);
  // }
};

export default handler;
