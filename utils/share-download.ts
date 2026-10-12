import { DOWNLOAD_META, DOWNLOAD_URL } from "./download-routing";

export type DownloadShareResult = "shared" | "copied" | "cancelled" | "manual";
type ShareCapabilities = {
  share?: (data: { title: string; text: string; url: string }) => Promise<void>;
  copy?: (text: string) => Promise<void>;
};

/** Call directly from a user gesture; never copy after a dismissed share sheet. */
export async function shareDownload({ share, copy }: ShareCapabilities): Promise<DownloadShareResult> {
  if (share) {
    try {
      await share({ title: DOWNLOAD_META.title, text: "ดาวน์โหลด JAOTHUI MOBILE — ข้อมูลกระบือไทยในมือคุณ", url: DOWNLOAD_URL });
      return "shared";
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return "cancelled";
    }
  }
  if (copy) {
    try {
      await copy(DOWNLOAD_URL);
      return "copied";
    } catch { /* Keep the selectable URL available when browser permissions block copying. */ }
  }
  return "manual";
}
