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

const names = ["NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET", "JAOTHUI_EVENT_SANITY_PROJECT_ID", "JAOTHUI_EVENT_SANITY_DATASET", "NODE_ENV", "NEXT_RUNTIME"];
const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
function configFor(projectId, dataset, eventProjectId, eventDataset) {
  const values = { NEXT_PUBLIC_SANITY_PROJECT_ID: projectId, NEXT_PUBLIC_SANITY_DATASET: dataset,
    JAOTHUI_EVENT_SANITY_PROJECT_ID: eventProjectId, JAOTHUI_EVENT_SANITY_DATASET: eventDataset };
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  delete require.cache[configPath];
  return { ...imageConfigDefault, ...require(configPath).images };
}
const admitted = (config, src) => hasMatch(config.domains, config.remotePatterns, new URL(src));
function allow(config, src) {
  assert(admitted(config, src), "configured public asset must reach the actual Next matcher");
  const optimized = imageLoader({ config, src, width: 720 });
  assert.equal(new URL(optimized, "https://jaothui.com").searchParams.get("url"), src);
}
let denied = 0;
function deny(config, src) {
  assert.equal(admitted(config, src), false, `unapproved source must remain closed: ${src}`);
  assert.throws(() => imageLoader({ config, src, width: 720 }), /not configured/, "actual development loader must reject the same source");
  denied++;
}
try {
  // Exercise the actual loader's allowlist check, even when the runner normally uses test/production.
  process.env.NODE_ENV = "development";
  delete process.env.NEXT_RUNTIME;
  const production = configFor("b8rs8xg2", "production");
  for (const src of actualCovers) {
    allow(production, src);
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
  ]) deny(production, src);

  allow(production, "https://wtnqjxerhmdnqszkhbvs.supabase.co/storage/v1/object/public/slipstorage/buffalo/71.jpg");
  allow(production, "https://flagcdn.com/w80/th.png");
  const staging = configFor("b8rs8xg2", "staging");
  allow(staging, actualCovers[0].replace("/production/", "/staging/"));
  deny(staging, actualCovers[0]);

  // Distinct synthetic tenants/datasets prove two exact pairs, never a project/dataset cross product.
  const news = "https://cdn.sanity.io/images/newsfixture/news-data/news-1280x720.png?fit=crop";
  const event = "https://cdn.sanity.io/images/eventfixture/Event_2026/poster-1920x1080.png";
  const both = configFor("newsfixture", "news-data", "eventfixture", "Event_2026");
  allow(both, news); allow(both, event);
  for (const src of [
    news.replace("/news-data/", "/Event_2026/"), event.replace("/Event_2026/", "/news-data/"),
    event.replace("/eventfixture/", "/thirdtenant/"), event.replace("/Event_2026/", "/unconfigured/"),
    event.replace("https:", "http:"), event.replace("https:", "ftp:"),
    event.replace("cdn.sanity.io", "cdn.sanity.io:8443"),
    event.replace("cdn.sanity.io", "cdn.sanity.io.attacker.test"),
    event.replace("cdn.sanity.io", "cdn.sanity.io@attacker.test"),
    event.replace("/images/", "/files/"), event.replace("/Event_2026/", "/Event_2026/nested/"),
  ]) deny(both, src);
  const absentEvent = configFor("newsfixture", "news-data");
  allow(absentEvent, news); deny(absentEvent, event);
  deny(configFor("newsfixture", "news-data", "eventfixture", undefined), event);
  deny(configFor("newsfixture", "news-data", undefined, "Event_2026"), event);
  const eventOnly = configFor(undefined, undefined, "eventfixture", "Event_2026");
  allow(eventOnly, event); deny(eventOnly, news);
  const unconfigured = configFor(undefined, undefined);
  deny(unconfigured, news); deny(unconfigured, event); deny(unconfigured, actualCovers[0]);

  assert.throws(() => configFor("b8rs8xg2", "*"), /Invalid.*SANITY_DATASET/);
  assert.throws(() => configFor("../other", "production"), /Invalid.*SANITY_PROJECT_ID/);
  for (const project of ["../other", "*", "event.test", "EVENT", "event/other"]) {
    assert.throws(() => configFor("newsfixture", "news-data", project, "production"), /Invalid JAOTHUI_EVENT_SANITY_PROJECT_ID/);
  }
  for (const dataset of ["*", "../production", "production/nested", "production?x=1"]) {
    assert.throws(() => configFor("newsfixture", "news-data", "eventfixture", dataset), /Invalid JAOTHUI_EVENT_SANITY_DATASET/);
  }
  console.log(`NEWS_EVENT_IMAGE_ALLOWLIST_OK: real Next matcher+loader, distinct news/Event pairs, ${denied} forbidden sources, missing/invalid config, editorial crop and existing sources preserved; offline only`);
} finally {
  for (const [name, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  delete require.cache[configPath];
}
