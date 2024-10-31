import { NextApiRequest, NextApiResponse } from "next";
import { getSEOMetadata } from "../../../server/services/seo.service";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { microchip, social } = req.query;

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
  if (!social) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${metadata.title}</title>
          <meta charset="UTF-8">
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://jaothui.com/cert/${microchip}" />
          <meta property="og:title" content="${metadata.title}" />
          <meta property="og:description" content="${metadata.description}" />
          <meta property="og:image" content="${metadata.ogImage}" />
          <script>
            setTimeout(() => {
              window.location.href = "https://www.jaothui.com/cert/${microchip}";
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
  } else {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>${metadata.title}</title>
          <meta charset="UTF-8">
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://jaothui.com/cert/${microchip}" />
          <meta property="og:title" content="${metadata.title}" />
          <meta property="og:description" content="${metadata.description}" />
          <meta property="og:image" content="${metadata.ogImage}" />
        <head>
        <body>
            <div style="height: 100vh; width:100%; display:flex; flex-direction: column; align-items:center; justify-content:center; font-size:1.2rem;">
            <a style="padding:8px; background-color:#E3A51D; color:#fff; border-radius:6px; box-shadow: 2px 2px 2px rgba(0,0,0,0.5);" href="https://jaothui.com/cert/${microchip}">ไปดูข้อมูลของ ${metadata.title}</a>
            </div>
        </body>
      </html>
      `);
  }
};

export default handler;
