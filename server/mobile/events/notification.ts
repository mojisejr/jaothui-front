import { randomUUID } from "crypto";
// Same official-account credential name as Event, never the LINE Login channel secret.
export async function notifyRoyal(lineId: string, data: { ownerName: string; buffaloName: string; microchip: string; docId: string }, fetcher: typeof fetch = fetch, env: NodeJS.ProcessEnv = process.env) {
  if (!env.oa_token) throw new Error("EVENT_LINE_NOTIFICATION_NOT_CONFIGURED: oa_token");
  const response = await fetcher("https://api.line.me/v2/bot/message/push", {
    method: "POST", headers: { Authorization: `Bearer ${env.oa_token}`, "Content-Type": "application/json", "X-Line-Retry-Key": randomUUID() },
    body: JSON.stringify({ to: lineId, messages: [{ type: "text", text: royalMessageParser(data) }] }), signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("EVENT_LINE_NOTIFICATION_FAILED");
}
export function royalMessageParser({
  ownerName,
  buffaloName,
  microchip,
  docId,
}: {
  ownerName: string;
  buffaloName: string;
  microchip: string;
  docId: string;
}) {
  return `
  🙏ขอขอบคุณ🙏
  👩‍🌾คุณ ${ownerName}👨🏻‍🌾

  =====================
  การลงทะเบียนคัดเลือกเข้าประกวด
  =====================
  ชื่อควาย
  ✅ ${buffaloName} 
  เลขประจำตัวสัตว์
  ✅ ${microchip}
  ได้รับการลงทะเบียนเรียบร้อยแล้ว
  ✅ อยู่ระหว่างการพิจารณา

  "กรุณารอการตอบกลับ"

  🌐 ตรวจสอบสถานะ
  https://jaothui-events.vercel.app/public/register-status/${docId}
  `;
}

