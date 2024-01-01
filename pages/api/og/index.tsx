import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getMetadataByMicrochipId } from "../../../server/services/metadata.service";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  try {
    const defaultImage = await fetch(
      new URL("./seo_logo.jpeg", import.meta.url)
    ).then((res) => res.arrayBuffer());

    const { searchParams } = new URL(req.url);
    const hasTokenId = searchParams.has("tokenId");
    const tokenId = hasTokenId
      ? searchParams.get("tokenId")?.slice(0, 100)
      : null;

    const metadata = hasTokenId
      ? await getMetadataByMicrochipId(tokenId!)
      : null;

    const image = metadata == null ? defaultImage : metadata.imageUri;

    console.log(metadata);
    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "black",
            height: "100%",
            width: "100%",
            display: "flex",
            textAlign: "center",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            flexWrap: "nowrap",
          }}
        >
          <img
            src={image}
            style={{
              height: "100%",
              width: "100%",
              objectFit: "contain",
              objectPosition: "center",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              bottom: "1rem",
              right: "9rem",
              fontSize: "25px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            <span>#{tokenId}</span>
            <span>{metadata.name}</span>
          </div>
        </div>
      )
    );
  } catch (error) {
    console.log(error);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
