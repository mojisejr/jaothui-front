import { NextApiRequest, NextApiResponse } from "next";
import { getSEOMetadata } from "../../../server/services/seo.service";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // const { searchParams } = new URL(req.url!);
  // const microchip = searchParams.get("microchip");
  const { microchip } = req.query;

  if (!microchip) {
    res.status(400).json({ error: "microchip not found" });
    return;
  }

  const metadata = await getSEOMetadata(microchip as string);

  if (!metadata) {
    res.status(400).json({ error: "cannot fetch metadata" });
    return;
  }

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${metadata.title}</title>
        <meta charset="UTF-8">
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${metadata.ogUrl}" />
        <meta property="og:title" content="${metadata.title}" />
        <meta property="og:description" content="${metadata.description}" />
        <meta property="og:image" content="${metadata.ogImage}" />
        <script>
          setTimeout(() => {
            window.location.href = "/cert/${microchip}";
          }, 300);
        </script>
      <head>
      <body>
          <div style="height: 100vh; width:100%; display:flex; flex-direction: column; align-items:center; justify-content:center; font-size:1rem;">
            กำลังโหลดข้อมูลของ ${metadata.title}
          </div>
      </body>
    </html>
    `);
};

export default handler;
