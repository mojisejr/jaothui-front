import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BsApple, BsGooglePlay } from "react-icons/bs";
import { FiArrowLeft, FiArrowUpRight, FiSmartphone } from "react-icons/fi";
import { V2Layout } from "../components/v2/V2Layout";
import { buttonVariants } from "../components/v2/Button";
import { cn } from "../components/v2/cn";
import { createStoreHandoff, DOWNLOAD_META, DOWNLOAD_URL, getDownloadDestination, STORE_URLS } from "../utils/download-routing";

type PublicNextPage = NextPage & { publicPage?: boolean };

const DownloadPage: PublicNextPage = () => {
  const handoff = useRef<ReturnType<typeof createStoreHandoff> | null>(null);
  const [status, setStatus] = useState("เลือก Store สำหรับอุปกรณ์ของคุณเพื่อดาวน์โหลด");

  useEffect(() => {
    const destination = getDownloadDestination({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
    }, window.location.search);
    if (!destination) return;
    if (!handoff.current) handoff.current = createStoreHandoff((url) => window.location.replace(url));
    if (handoff.current(destination)) setStatus("กำลังเปิด Store… หากยังไม่เปิด กรุณาเลือกปุ่มด้านล่าง");
  }, []);

  return (
    <>
      <Head>
        <title>{DOWNLOAD_META.title}</title>
        <meta name="description" content={DOWNLOAD_META.description} />
        <link rel="canonical" href={DOWNLOAD_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="th_TH" />
        <meta property="og:site_name" content="JAOTHUI" />
        <meta property="og:title" content={DOWNLOAD_META.title} />
        <meta property="og:description" content={DOWNLOAD_META.description} />
        <meta property="og:url" content={DOWNLOAD_URL} />
        <meta property="og:image" content={DOWNLOAD_META.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content={DOWNLOAD_META.imageAlt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={DOWNLOAD_META.title} />
        <meta name="twitter:description" content={DOWNLOAD_META.description} />
        <meta name="twitter:image" content={DOWNLOAD_META.image} />
        <meta name="twitter:image:alt" content={DOWNLOAD_META.imageAlt} />
      </Head>
      <V2Layout hideNav className="max-w-6xl">
        <div className="px-5 py-6 mobileM:px-8 tabletS:px-10 tabletS:py-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" aria-label="JAOTHUI หน้าหลัก" className="inline-flex min-h-[44px] items-center gap-3 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
              <Image src="/images/thuiLogo.png" alt="" width={44} height={40} className="h-10 w-11 object-contain" />
              <span className="text-lg font-bold tracking-wider text-accent">JAOTHUI</span>
            </Link>
            <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded-card px-2 text-sm font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
              <FiArrowLeft aria-hidden /> กลับเว็บไซต์
            </Link>
          </header>

          <section className="mt-8 grid overflow-hidden rounded-[28px] bg-surface tabletS:mt-12 tabletS:grid-cols-2">
            <div className="relative min-h-[210px] tabletS:order-2 tabletS:min-h-[550px]">
              <Image src="/images/jaothui-v2-hero-image.png" alt="กระบือไทยยามอาทิตย์อัสดง" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-right" />
              <div aria-hidden className="absolute inset-0 bg-gradient-hero-fade" />
              <div className="absolute bottom-5 left-6 right-6 tabletS:bottom-8 tabletS:left-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Thai Buffalo Platform</p>
                <p className="mt-2 text-base font-medium text-foreground">อนุรักษ์สายพันธุ์ไทย ด้วยเทคโนโลยี</p>
              </div>
            </div>

            <div className="flex flex-col justify-center px-6 py-8 mobileM:px-8 tabletS:py-12">
              <p className="flex items-center gap-2 text-sm font-semibold tracking-widest text-accent"><FiSmartphone aria-hidden /> JAOTHUI MOBILE</p>
              <h1 className="mt-5 text-3xl font-bold leading-tight tabletS:text-4xl">ข้อมูลกระบือไทย<br /><span className="text-accent">ในมือคุณ</span></h1>
              <p className="mt-5 max-w-md text-base leading-7 text-muted">ค้นหากระบือ ดูข้อมูลพันธุ์ประวัติ และติดตามข่าวสารกับกิจกรรมจากเจ้าทุยได้ในแอปเดียว</p>
              <h2 className="mt-8 text-lg font-semibold text-foreground">ดาวน์โหลด JAOTHUI MOBILE</h2>
              <p role="status" className="mt-2 text-sm leading-6 text-muted">{status}</p>
              <div className="mt-5 flex flex-col gap-3">
                <a href={STORE_URLS.ios} className={cn(buttonVariants({ variant: "gold-fill", size: "lg", block: true }), "justify-between")}>
                  <span className="flex items-center gap-3"><BsApple aria-hidden className="h-6 w-6" /><span className="font-semibold">ดาวน์โหลดบน App Store</span></span><FiArrowUpRight aria-hidden className="shrink-0" />
                </a>
                <a href={STORE_URLS.android} className={cn(buttonVariants({ variant: "gold-outline", size: "lg", block: true }), "justify-between")}>
                  <span className="flex items-center gap-3"><BsGooglePlay aria-hidden className="h-5 w-5" /><span className="font-semibold">ดาวน์โหลดบน Google Play</span></span><FiArrowUpRight aria-hidden className="shrink-0" />
                </a>
              </div>
              <p className="mt-4 text-xs leading-6 text-muted">หากเปิดจาก LINE หรือ Facebook แล้ว Store ไม่เปิด ให้เลือกปุ่มด้านบน หรือเปิดลิงก์นี้ใน Safari / Chrome</p>
            </div>
          </section>

          <section aria-labelledby="scan-heading" className="mt-8 flex flex-col items-center gap-5 text-center tabletS:flex-row tabletS:justify-center tabletS:text-left">
            <div className="rounded-photo bg-white p-3">
              <QRCodeSVG data-testid="download-qr" value={DOWNLOAD_URL} size={120} level="M" includeMargin title="สแกนเพื่อดาวน์โหลด JAOTHUI MOBILE" />
            </div>
            <div>
              <h2 id="scan-heading" className="text-lg font-semibold">สแกนด้วยโทรศัพท์เพื่อดาวน์โหลด</h2>
              <p className="mt-2 text-sm leading-6 text-muted">ลิงก์เดียวสำหรับ iPhone และ Android</p>
              <p className="mt-1 text-sm font-medium text-accent">www.jaothui.com/download</p>
            </div>
          </section>
          <footer className="mt-10 flex flex-wrap justify-center gap-5 border-t border-border-soft pt-5 text-sm text-muted">
            <Link href="/support" className="inline-flex min-h-[44px] items-center rounded-card px-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">ติดต่อ / ขอความช่วยเหลือ</Link>
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center rounded-card px-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">นโยบายความเป็นส่วนตัว</Link>
          </footer>
        </div>
      </V2Layout>
    </>
  );
};

// Render links and social metadata in initial HTML, without wallet/auth gates.
DownloadPage.publicPage = true;
export default DownloadPage;
