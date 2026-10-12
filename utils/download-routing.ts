/** Public, fixed destinations. Never accept a redirect URL from query input. */
export const DOWNLOAD_URL = "https://www.jaothui.com/download";
export const STORE_URLS = {
  ios: "https://apps.apple.com/app/id6792759847",
  android: "https://play.google.com/store/apps/details?id=com.jaothui.mobile",
} as const;
export const DOWNLOAD_META = {
  title: "ดาวน์โหลด JAOTHUI MOBILE | เจ้าทุย",
  description: "ข้อมูลกระบือไทย พันธุ์ประวัติ ข่าวสารและกิจกรรมจากเจ้าทุย ดาวน์โหลด JAOTHUI MOBILE สำหรับ iPhone และ Android",
  image: "https://www.jaothui.com/images/jaothui-download-og-v1.png",
  imageAlt: "JAOTHUI MOBILE — ข้อมูลกระบือไทยในมือคุณ ดาวน์โหลดสำหรับ iOS และ Android",
} as const;

export type DeviceInfo = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
};

export function getDownloadDestination(device: DeviceInfo, search = ""): string | null {
  if (new URLSearchParams(search).get("manual") === "1") return null;
  const ua = device.userAgent;
  // Crawlers should always read our public HTML, not navigate to a Store page.
  if (/bot\b|crawler|spider|facebookexternalhit|facebot|line-poker|linebot|slackbot|discordbot|whatsapp|linkedinbot/i.test(ua)) return null;
  if (/android/i.test(ua)) return STORE_URLS.android;
  if (/iphone|ipad|ipod/i.test(ua)) return STORE_URLS.ios;
  // iPadOS Safari may identify itself as a Mac. Keep unknowns on the landing.
  if (device.platform === "MacIntel" && (device.maxTouchPoints ?? 0) > 1) return STORE_URLS.ios;
  return null;
}

/** One attempt per page instance, including React StrictMode effect replay. */
export function createStoreHandoff(navigate: (url: string) => void) {
  let attempted = false;
  return (destination: string | null): boolean => {
    if (attempted || !Object.values(STORE_URLS).some((url) => url === destination)) return false;
    attempted = true;
    try {
      navigate(destination!);
      return true;
    } catch {
      // WebViews can reject automatic navigation; the real anchors remain usable.
      return false;
    }
  };
}
