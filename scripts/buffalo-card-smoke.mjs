import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buffaloSex } from "../utils/buffalo-sex.ts";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
for (const [input, label, symbol] of [["male","ผู้","♂"],[" Male ","ผู้","♂"],["female","เมีย","♀"],["FEMALE","เมีย","♀"],
  [null,"ไม่ระบุ",""],[undefined,"ไม่ระบุ",""],["","ไม่ระบุ",""],["unknown","ไม่ระบุ",""],["หญิง","ไม่ระบุ",""],[1,"ไม่ระบุ",""]]) {
  assert.equal(buffaloSex(input).label,label); assert.equal(buffaloSex(input).symbol,symbol);
}
for (const path of ["pages/v2/index.tsx","pages/v2/buffalo.tsx","pages/v2/profile.tsx"]) {
  const source = read(path);
  assert.match(source, /sex=\{(?:item|cert)\.sex\}/);
  assert.match(source, /grid-cols-1 gap-3 mobileS:grid-cols-2/);
}
for (const path of ["components/Shared/Card/PedigreeCard.tsx","components/Profile/PedigreeSmallCard.tsx","components/Home/Pedigree/index.tsx"]) {
  assert.match(read(path), /<BuffaloSex value=\{(?:data\?|item)\.sex\}/);
  assert.match(read(path), /<BuffaloPhotoFeedback/); assert.match(read(path), /<BuffaloPhotoStatus/);
}
assert.match(read("components/Shared/Card/PedigreeCard.tsx"), /canVote[\s\S]*CountryFlag/);
assert.match(read("components/Home/Pedigree/index.tsx"), /เปิดดูใบพันธุ์ประวัติ/);
assert.match(read("components/v2/BuffaloPhotoFeedback.tsx"), /min-h-\[44px\]/);
assert.match(read("components/v2/BuffaloPhotoFeedback.tsx"), /max-w-\[32%\] min-w-0 shrink-0 break-words leading-\[14px\]/);
assert.match(read("components/v2/BuffaloPhotoFeedback.tsx"), /data-card-photo-footer className="[^"]*h-11[^"]*gap-1"/);
// At the observed narrowest two-column footer (375px viewport), preserve the
// actual 49.21px rendered retry and 4px token gaps. Old35%/8px left26.87px and
// forced the Thai error into3lines/48px. The new budget leaves >=34px; the
// browser lane must still prove glyph wrapping, not this arithmetic alone.
const feedbackTextWidth=(leadingShare,gap)=>135.5-135.5*leadingShare-gap-49.21-4;
assert(feedbackTextWidth(.32,4)>=34);
assert(feedbackTextWidth(.35,8)<27);
assert.doesNotMatch(read("components/v2/BuffaloPhotoFeedback.tsx"), /truncate|line-clamp|aria-live/);
assert.match(read("components/v2/BuffaloCard.tsx"), /line-clamp-2/);
assert.match(read("components/v2/BuffaloSex.tsx"), /aria-hidden="true"/);
assert.match(read("components/v2/BuffaloSex.tsx"), /className="sr-only">เพศ/);
console.log("BUFFALO_CARD_OK canonical sex/neutral unknown, all active consumers, responsive fallback, legacy affordances and footer contract");
