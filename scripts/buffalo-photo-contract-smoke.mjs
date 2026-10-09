import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import ts from "typescript";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime.js";
import { imageConfigDefault } from "next/dist/shared/lib/image-config.js";
import { BuffaloPhoto } from "../components/v2/BuffaloPhoto.tsx";
import { BuffaloCard } from "../components/v2/BuffaloCard.tsx";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const nextConfig = (await import("../next.config.js")).default;
const render = (child) => renderToStaticMarkup(React.createElement(ImageConfigContext.Provider, {
  value: { ...imageConfigDefault, ...nextConfig.images },
}, child));
const photo = (src, sizes = "250px") => render(React.createElement(BuffaloPhoto, {
  src, alt: "ฟ้าประทาน — near-edge nose", sizes,
}));

function assertPhoto(markup) {
  assert.match(markup, /class="object-contain object-center p-1"/);
  assert.doesNotMatch(markup, /object-cover|scale-|rounded-/);
  assert.match(markup, /data-nimg="fill"/);
  assert.match(markup, /sizes="[^"]+"/);
  assert.match(markup, /srcSet=/i, "preserve optimized density/size choices");
  assert.match(markup, /alt="ฟ้าประทาน/);
}

const knownSource = "https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/buffalo/71.jpg";
const markup = photo(knownSource);
assertPhoto(markup);
assert.match(markup, /loading="lazy"/, "card photos remain lazy by default");
assert.match(markup, /71.jpg/, "do not replace or transform the original path to a crop");
assertPhoto(photo(undefined));
assert.match(photo(undefined), /logo.png/, "missing images use the existing fallback");
assert.match(photo(undefined, "64px"), /sizes="64px"/, "small thumbnails stay bounded");
assert.throws(() => assertPhoto(markup.replace("object-contain", "object-cover")), "cover mutant must fail");
assert.throws(() => assertPhoto(markup.replace("p-1", "p-1 group-hover:scale-105")), "zoom mutant must fail");

const cardMarkup = render(React.createElement(BuffaloCard, {
  name: "ฟ้าประทาน", chip: "764040226300035", ageMonths: 71,
  birthdate: "13 ม.ค. 2562", image: React.createElement(BuffaloPhoto, { src: knownSource, alt: "ฟ้าประทาน" }),
}));
function assertGallery(markup) {
  assert.match(markup, /aspect-\[3\/2\]/, "fixed gallery geometry survives loading");
  assert.match(markup, /rounded-photo border border-photo-hairline bg-surface/);
  assert.doesNotMatch(markup, /shadow-gold|bg-surface-raised|rounded-pill/, "no heavy surround/glow/boxed age");
}
assertGallery(cardMarkup);
assert.throws(() => assertGallery(cardMarkup.replace("aspect-[3/2]", "aspect-[4/3]")), "old frame mutant must fail");
assert.throws(() => assertGallery(cardMarkup.replace("rounded-photo", "rounded-card")), "unsafe clip mutant must fail");
assert.throws(() => assertGallery(cardMarkup.replace("bg-surface", "bg-surface-raised")), "contrasting surround mutant must fail");
assert.throws(() => assertGallery(cardMarkup.replace("text-left", "text-left shadow-gold")), "heavy glow mutant must fail");
assert.match(cardMarkup, /71 เดือน/);
assert.doesNotMatch(cardMarkup, /absolute bottom-|backdrop-blur/, "no age overlay can conceal source bounds");
assert(cardMarkup.indexOf("71 เดือน") > cardMarkup.indexOf("764040226300035"), "age is in the information body");

// Check emitted utilities, not just the presence of class strings. Math below uses
// their actual fit + inset; browser Eye separately proves pixels and CSS layout.
const config = (await import("../tailwind.config.js")).default;
const css = (await postcss([tailwindcss({
  ...config, plugins: [],
  content: [{ raw: 'object-contain object-center p-1 aspect-[3/2] rounded-photo border-photo-hairline', extension: "html" }],
})]).process("@tailwind utilities;", { from: undefined })).css;
assert.match(css, /object-fit:\s*contain/);
assert.match(css, /object-position:\s*center/);
assert.match(css, /padding:\s*0\.25rem/);
assert.match(css, /aspect-ratio:\s*3\s*\/\s*2/);
assert.match(css, /border-radius:\s*var\(--ref-radius-photo\)/);
assert.match(css, /border-color:\s*var\(--photo-hairline\)/);
assert.match(read("styles/globals.css"), /--ref-radius-photo: 0\.75rem/);
assert.match(read("styles/globals.css"), /--photo-hairline: rgba\(214, 177, 95, 0\.08\)/);

// Every source corner must lie within both the frame and its rounded clip. No
// anatomical/edge pixels are special-cased. Portrait/square/4:3 touch vertical
// edges; 3:2/16:9 touch horizontal edges after contain.
function fitsSourceBounds(sw, sh, fw, fh, fit = "contain", inset = 4, radius = 12) {
  const innerWidth = fw - 2 * inset, innerHeight = fh - 2 * inset;
  const scale = (fit === "contain" ? Math.min : Math.max)(innerWidth / sw, innerHeight / sh);
  const width = sw * scale, height = sh * scale;
  const left = (fw - width) / 2, top = (fh - height) / 2;
  const right = fw - left, bottom = fh - top;
  const inside = (x, y) => {
    if (x < 0 || y < 0 || x > fw || y > fh) return false;
    const cx = x < radius ? radius : x > fw - radius ? fw - radius : x;
    const cy = y < radius ? radius : y > fh - radius ? fh - radius : y;
    return Math.hypot(x - cx, y - cy) <= radius + 1e-8;
  };
  assert(Math.abs(width / height - sw / sh) < 1e-8, "uniform scale must preserve aspect");
  return [[left, top], [right, top], [left, bottom], [right, bottom]].every(([x, y]) => inside(x, y));
}
for (const [sw, sh] of [[3000, 2000], [1920, 1080], [400, 300], [1000, 1000], [800, 1200]]) {
  for (const [fw, fh] of [[148, 148 / 1.5], [235, 235 / 1.5], [856, 856 / 1.5], [64, 64], [56, 56]]) {
    assert(fitsSourceBounds(sw, sh, fw, fh), `${sw}:${sh} in ${fw}:${fh} must retain all four source corners`);
  }
}
assert.equal(fitsSourceBounds(3000, 2000, 235, 176.25, "cover"), false, "known 3:2 cover clipping is detected");
assert.equal(fitsSourceBounds(140, 148 / 1.5 - 8, 148, 148 / 1.5), true, "edge-filled inner-ratio corners are safe");
assert.equal(fitsSourceBounds(140, 148 / 1.5 - 8, 148, 148 / 1.5, "contain", 4, 16), false, "old radius with smaller inset is unsafe");
assert.equal(fitsSourceBounds(3000, 2000, 148, 148 / 1.5, "contain", 0), false, "rounded-corner mutant is detected");

// AST checks protect all active identity consumers without banning decorative
// cover images in the same file (Home hero and member avatar remain cover).
const consumers = [
  "pages/v2/index.tsx", "pages/v2/buffalo.tsx", "pages/v2/profile.tsx",
  "components/Cert/Detail/BuffaloDetailV2.tsx", "pages/cert/index.tsx",
  "components/Home/Pedigree/index.tsx", "components/Shared/Card/PedigreeCard.tsx",
  "components/Profile/PedigreeSmallCard.tsx",
];
function assertConsumers(path, text) {
  const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let photos = 0;
  const walk = (node) => {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(ast);
      const attrs = node.attributes.getText(ast);
      if (tag === "BuffaloPhoto") {
        photos++;
        assert.doesNotMatch(attrs, /className|style|unoptimized/, `${path}: caller cannot override identity fit/optimization`);
        assert.match(attrs, /sizes=/, `${path}: responsive source size is explicit`);
      }
      if (["RemoteImage", "Image", "img"].includes(tag)) {
        assert.doesNotMatch(attrs, /(?:item|cert|certNft|r|data)\??\.(?:image|imageUri)/, `${path}: identity photo bypassed primitive`);
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
  assert(photos > 0, `${path}: missing identity photo renderer`);
  assert.doesNotMatch(text, /group-hover:scale-105/, `${path}: identity caller must not reintroduce zoom`);
}
for (const path of consumers) assertConsumers(path, read(path));
for (const path of ["pages/v2/index.tsx", "pages/v2/buffalo.tsx", "components/Cert/Detail/BuffaloDetailV2.tsx", "components/Home/Pedigree/index.tsx", "components/Shared/Card/PedigreeCard.tsx", "components/Profile/PedigreeSmallCard.tsx", "pages/cert/index.tsx"]) {
  assert.doesNotMatch(read(path), /aspect-\[4\/3\]/, `${path}: loaded/loading photos share gallery geometry`);
}
assert.throws(() => assertConsumers("pages/v2/buffalo.tsx", read("pages/v2/buffalo.tsx").replaceAll("BuffaloPhoto", "RemoteImage")), "caller-bypass mutant must fail");
assert.match(read("pages/v2/index.tsx"), /object-cover object-right/, "decorative hero policy is untouched");
assert.match(read("pages/v2/profile.tsx"), /src=\{avatarSrc\}[^\n]+object-cover/, "avatar policy is untouched");
assert.match(read("components/v2/NewsEventCard.tsx"), /object-cover/, "editorial covers are not identity photos");
assert.match(read("components/v2/BuffaloPhoto.tsx"), /key=\{props.src/, "a changed photo resets prior failed-image state");
assert.doesNotMatch(read("components/Home/Pedigree/index.tsx"), /pointer-events-none absolute inset-y-0/, "legacy rail edge scrims must not shade the actual source photo");
assert.match(read("components/Shared/Card/PedigreeCard.tsx"), /relative w-full max-w-\[320px\]/, "fill images need stable explicit legacy card width");
assert.doesNotMatch(read("components/Shared/Card/PedigreeCard.tsx"), /w-84/, "undefined width utility must not depend on source intrinsic size");
console.log("BUFFALO_PHOTO_CONTRACT_OK: rendered contain/inset/age, responsive sources, all active callers, aspect/corner geometry, cover/zoom/bypass mutants");
