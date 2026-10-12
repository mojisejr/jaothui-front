import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { DOWNLOAD_URL } from "../../utils/download-routing";
import { AppDownloadActions } from "./AppDownloadActions";

export function HomeAppDownload() {
  return (
    <section aria-labelledby="home-download-title" className="px-5 py-6">
      <div className="relative overflow-hidden rounded-card border border-border-soft bg-surface p-5 mobileM:p-6">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-gradient-hero-glow" />
        <div className="relative flex items-start gap-4">
          <Image src="/images/thuiLogo.png" alt="" width={44} height={44} className="mt-1 h-11 w-11 shrink-0 object-contain" />
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-accent">JAOTHUI MOBILE</p>
            <h2 id="home-download-title" className="mt-2 text-xl font-bold leading-snug text-foreground">เจ้าทุย พร้อมอยู่ในมือคุณแล้ว</h2>
            <p className="mt-2 text-sm leading-6 text-muted">ค้นหากระบือ ดูพันธุ์ประวัติ และติดตามข่าวสารได้ในแอปเดียว</p>
          </div>
        </div>
        <div className="relative mt-5 grid items-center gap-6 tabletS:grid-cols-[1fr_112px]">
          <AppDownloadActions />
          <div className="hidden text-center tabletS:block">
            <div className="inline-flex rounded-photo bg-white p-2">
              <QRCodeSVG value={DOWNLOAD_URL} size={96} level="M" title="สแกนเพื่อดาวน์โหลด JAOTHUI MOBILE" />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">สแกนเพื่อดาวน์โหลด</p>
          </div>
        </div>
      </div>
    </section>
  );
}
