import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const card = read("components/v2/NewsEventCard.tsx");
const schema = read("sanity/schema/newsEvent.ts");
const imageHelper = read("sanity/lib/image.ts");
const service = read("server/services/news-event.service.ts");
const mobileBff = read("server/mobile/news-events.ts");

assert(card.includes("aspect-[16/9]"), "NewsEventCard must render cover images as 16:9");
assert(!card.includes("aspect-[16/10]"), "NewsEventCard must not keep the old 16:10 ratio");

assert(schema.includes("16:9"), "Sanity coverImage field must document the 16:9 contract");
assert(schema.includes("1920x1080"), "Sanity coverImage field must include creator size guidance");
assert(schema.includes("กลางภาพ"), "Sanity coverImage guidance must mention safe center composition");

assert(
  imageHelper.includes("NEWS_EVENT_COVER_IMAGE_WIDTH = 1280") &&
    imageHelper.includes("NEWS_EVENT_COVER_IMAGE_HEIGHT = 720"),
  "Sanity image helper must define the 1280x720 news event transform"
);
assert(imageHelper.includes(".fit('crop')"), "Sanity news event image helper must crop to the target frame");
assert(imageHelper.includes(".auto('format')"), "Sanity news event image helper must keep automatic format optimization");

assert(service.includes("coverImage,"), "News event query must fetch the Sanity image object");
assert(
  service.includes('"rawCoverImageUrl": coverImage.asset->url'),
  "News event query must keep a raw URL fallback"
);
assert(
  service.includes("getNewsEventCoverImageUrl(item.coverImage, item.rawCoverImageUrl)"),
  "News event mapper must use the hardened 16:9 URL builder with fallback"
);

assert(
  mobileBff.includes("coverImageUrl: item.coverImageUrl"),
  "Mobile BFF must preserve the existing coverImageUrl contract"
);

console.log("NEWS_EVENT_IMAGE_RATIO_CONTRACT_OK");
