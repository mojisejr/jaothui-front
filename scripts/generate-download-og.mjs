// Manual artwork build, never run by the production request path or next build.
// Code-native typography/layout with the existing JAOTHUI mark (no AI logo).
import { createCanvas, loadImage, registerFont } from "canvas";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const temporary = mkdtempSync(join(tmpdir(), "jaothui-download-font-"));
try {
  for (const [weight, url] of [
    ["600", "https://fonts.gstatic.com/s/prompt/v12/-W_8XJnvUD7dzB2Cv_44bg.ttf"],
    ["700", "https://fonts.gstatic.com/s/prompt/v12/-W_8XJnvUD7dzB2C2_84bg.ttf"],
  ]) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Prompt font HTTP${response.status}`);
    const path = join(temporary, `Prompt-${weight}.ttf`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
    registerFont(path, { family: "Prompt", weight });
  }
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, 1200, 630);
  const glow = ctx.createRadialGradient(970, 280, 0, 970, 280, 520);
  glow.addColorStop(0, "rgba(214,177,95,0.12)");
  glow.addColorStop(1, "rgba(214,177,95,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 630);
  const logo = await loadImage(new URL("../public/images/thuiLogo.png", import.meta.url).pathname);
  ctx.drawImage(logo, 68, 55, 55, 50);
  ctx.fillStyle = "#d6b15f";
  ctx.font = '700 28px "Prompt"';
  ctx.fillText("JAOTHUI MOBILE", 140, 90);
  ctx.fillStyle = "#f5f5f5";
  ctx.font = '700 58px "Prompt"';
  ctx.fillText("ข้อมูลกระบือไทย", 68, 239);
  ctx.fillStyle = "#d6b15f";
  ctx.fillText("ในมือคุณ", 68, 317);
  ctx.font = '600 24px "Prompt"';
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText("พันธุ์ประวัติ · ข่าวสาร · กิจกรรมเจ้าทุย", 70, 375);
  ctx.fillStyle = "#d6b15f";
  ctx.beginPath(); ctx.roundRect(68, 422, 510, 63, 16); ctx.fill();
  ctx.fillStyle = "#070707";
  ctx.font = '600 24px "Prompt"';
  ctx.fillText("ดาวน์โหลดสำหรับ iOS และ Android", 93, 463);
  ctx.drawImage(logo, 787, 170, 300, 271);
  ctx.strokeStyle = "rgba(214,177,95,0.14)";
  ctx.beginPath(); ctx.moveTo(68, 527); ctx.lineTo(1132, 527); ctx.stroke();
  ctx.fillStyle = "#a3a3a3";
  ctx.font = '600 21px "Prompt"';
  ctx.fillText("www.jaothui.com/download", 68, 573);
  const output = new URL("../public/images/jaothui-download-og-v1.png", import.meta.url);
  writeFileSync(output, canvas.toBuffer("image/png"));
  console.log(`OG artwork rendered: ${output.pathname} (1200×630)`);
} finally {
  // Explicit fresh mkdtemp directory owned only by this generator.
  rmSync(temporary, { recursive: true });
}
