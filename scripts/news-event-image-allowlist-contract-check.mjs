import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const configPath = require.resolve("../next.config.js");
const { hasMatch } = require("next/dist/shared/lib/match-remote-pattern");
const { imageConfigDefault } = require("next/dist/shared/lib/image-config");
const imageLoader = require("next/dist/shared/lib/image-loader").default;

// Public production URLs observed on 2026-10-09 via /api/mobile/v1/news-events.
// Offline regression fixtures: no Sanity token/network is needed to run these.
const actualCovers = [
  "https://cdn.sanity.io/images/b8rs8xg2/production/5ca9138756b987bbfe7338e4187eff2ddb616bfe-1672x941.png?w=1280&h=720&fit=crop&auto=format",
  "https://cdn.sanity.io/images/b8rs8xg2/production/ebfcab9c6db51c21adc18fec092768ffe434b137-1672x941.png?w=1280&h=720&fit=crop&auto=format",
];

const previous = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
};
function configFor(projectId, dataset) {
  if (projectId === undefined) delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  else process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = projectId;
  if (dataset === undefined) delete process.env.NEXT_PUBLIC_SANITY_DATASET;
  else process.env.NEXT_PUBLIC_SANITY_DATASET = dataset;
  delete require.cache[configPath];
  return { ...imageConfigDefault, ...require(configPath).images };
}
const admitted = (config, src) => hasMatch(config.domains, config.remotePatterns, new URL(src));
try {
  const production = configFor("b8rs8xg2", "production");
  for (const src of actualCovers) {
    assert(admitted(production, src), "actual news asset must reach Next image optimizer");
    const optimized = imageLoader({ config: production, src, width: 640 });
    assert.equal(new URL(optimized, "https://jaothui.com").searchParams.get("url"), src);
    const params = new URL(src).searchParams;
    assert.equal(params.get("w"), "1280");
    assert.equal(params.get("h"), "720");
    assert.equal(params.get("fit"), "crop", "editorial news still uses 16:9 crop, not identity contain");
  }
  for (const src of [
    actualCovers[0].replace("https:", "http:"),
    actualCovers[0].replace("cdn.sanity.io", "cdn.sanity.io:8443"),
    actualCovers[0].replace("/b8rs8xg2/", "/otherproject/"),
    actualCovers[0].replace("/production/", "/staging/"),
    actualCovers[0].replace("/images/", "/files/"),
    actualCovers[0].replace("/production/", "/production/nested/"),
    actualCovers[0].replace("cdn.sanity.io", "cdn.sanity.io.example.com"),
  ]) assert.equal(admitted(production, src), false, `unapproved source must remain closed: ${src}`);

  assert(admitted(production, "https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/buffalo/71.jpg"), "buffalo source remains admitted");
  assert(admitted(production, "https://flagcdn.com/w80/th.png"), "country flags remain admitted");
  const staging = configFor("b8rs8xg2", "staging");
  assert(admitted(staging, actualCovers[0].replace("/production/", "/staging/")), "allowlist follows configured dataset without broad wildcard");
  assert.equal(admitted(staging, actualCovers[0]), false);
  assert.equal(admitted(configFor(undefined, undefined), actualCovers[0]), false, "missing configuration must not open the entire CDN");
  assert.throws(() => configFor("b8rs8xg2", "*"), /Invalid.*SANITY_DATASET/);
  assert.throws(() => configFor("../other", "production"), /Invalid.*SANITY_PROJECT_ID/);
  console.log("NEWS_EVENT_IMAGE_ALLOWLIST_OK: actual production covers, optimizer roundtrip, narrow tenant/dataset/protocol/port/path, editorial crop preserved");
} finally {
  configFor(previous.projectId, previous.dataset);
}
