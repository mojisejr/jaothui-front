import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createStoreHandoff, DOWNLOAD_META, DOWNLOAD_URL, getDownloadDestination, STORE_URLS } from "../utils/download-routing.ts";

const matrix = [
  [{ userAgent: "Mozilla/5.0 (Linux; Android 15) Chrome/140 Mobile" }, STORE_URLS.android],
  [{ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" }, STORE_URLS.ios],
  [{ userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0)" }, STORE_URLS.ios],
  [{ userAgent: "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0)" }, STORE_URLS.ios],
  [{ userAgent: "Mozilla/5.0 Macintosh Safari", platform: "MacIntel", maxTouchPoints: 5 }, STORE_URLS.ios],
  [{ userAgent: "Mozilla/5.0 Macintosh Safari", platform: "MacIntel", maxTouchPoints: 0 }, null],
  [{ userAgent: "Mozilla/5.0 Windows Chrome", maxTouchPoints: 10 }, null],
  [{ userAgent: "", platform: "" }, null],
  [{ userAgent: "Mozilla/5.0 Android Googlebot/2.1" }, null],
  [{ userAgent: "facebookexternalhit/1.1 iPhone" }, null],
  [{ userAgent: "Twitterbot/1.0" }, null],
  [{ userAgent: "LineBot/1.0 iPhone" }, null],
  [{ userAgent: "Mozilla/5.0 Android LINE/15.0" }, STORE_URLS.android],
];
for (const [device, expected] of matrix) {
  assert.equal(getDownloadDestination(device), expected, device.userAgent);
  assert.equal(getDownloadDestination(device, "?manual=1"), null);
}
assert.equal(getDownloadDestination(matrix[0][0], "?redirect=https://evil.example"), STORE_URLS.android);
assert.equal(getDownloadDestination(matrix[0][0], "?manual=0"), STORE_URLS.android);
const calls = [];
const handoff = createStoreHandoff((url) => calls.push(url));
assert.equal(handoff(null), false);
assert.equal(handoff("https://evil.example"), false);
assert.equal(handoff(STORE_URLS.ios), true);
assert.equal(handoff(STORE_URLS.android), false);
assert.deepEqual(calls, [STORE_URLS.ios], "StrictMode cannot hand off twice");
let rejected = 0;
const blocked = createStoreHandoff(() => { rejected++; throw new Error("WebView blocked"); });
assert.equal(blocked(STORE_URLS.android), false);
assert.equal(blocked(STORE_URLS.android), false);
assert.equal(rejected, 1);
const source = readFileSync(new URL("../pages/download.tsx", import.meta.url), "utf8");
assert(source.includes("DownloadPage.publicPage = true"));
assert(/<QRCodeSVG\b[^>]*value=\{DOWNLOAD_URL\}/.test(source));
assert(source.includes("window.location.replace(url)"));
// Both homepage controls must target v2 directly, including client-side navigation.
assert(/<Link\b[^>]*href="\/v2"[^>]*aria-label="JAOTHUI หน้าหลัก"/.test(source), "download logo returns to v2");
assert(/<Link\b[^>]*href="\/v2"[^>]*>\s*<FiArrowLeft\b[^>]*\/>\s*กลับเว็บไซต์/.test(source), "back-to-website returns to v2");
const png = readFileSync(new URL("../public/images/jaothui-download-og-v1.png", import.meta.url));
assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);

// Optional real-server check: never equate source checks with rendered metadata.
if (process.env.DOWNLOAD_CHECK_BASE_URL) {
  const base = process.env.DOWNLOAD_CHECK_BASE_URL;
  for (const ua of ["Mozilla/5.0 Android", "facebookexternalhit/1.1", "Twitterbot/1.0", "LineBot/1.0"]) {
    const response = await fetch(`${base}/download`, { redirect: "manual", headers: { "User-Agent": ua } });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.equal((html.match(/<title>/g) ?? []).length, 1, "one effective title");
    assert(html.includes(`<title>${DOWNLOAD_META.title}</title>`));
    assert.equal((html.match(/name="description"/g) ?? []).length, 1);
    for (const [property, content] of Object.entries({ "og:title": DOWNLOAD_META.title, "og:description": DOWNLOAD_META.description, "og:url": DOWNLOAD_URL, "og:image": DOWNLOAD_META.image, "og:image:width": "1200", "og:image:height": "630" })) {
      assert(html.includes(`property="${property}" content="${content}"`), property);
    }
    assert(html.includes(`href="${STORE_URLS.ios}"`));
    assert(html.includes(`href="${STORE_URLS.android.replaceAll("&", "&amp;")}"`));
    assert(html.includes(`rel="canonical" href="${DOWNLOAD_URL}"`));
    assert(html.includes("<svg"), "QR renders without JavaScript");
    assert(/<a\b(?=[^>]*href="\/v2")(?=[^>]*aria-label="JAOTHUI หน้าหลัก")[^>]*>/.test(html), "rendered logo targets v2");
    assert(/<a\b[^>]*href="\/v2"[^>]*>\s*<svg\b[\s\S]*?<\/svg>\s*กลับเว็บไซต์<\/a>/.test(html), "rendered back-to-website targets v2");
  }
  const image = await fetch(`${base}/images/jaothui-download-og-v1.png`);
  assert.equal(image.status, 200);
  assert(image.headers.get("content-type")?.includes("image/png"));
  console.log("DOWNLOAD_HTTP_OK: initial metadata/links/QR and artwork available to normal/crawler UAs");
}
console.log("DOWNLOAD_CONTRACT_OK: platform matrix, manual/bot fallback, fixed URLs, one-shot/rejected handoff, PNG1200x630");
