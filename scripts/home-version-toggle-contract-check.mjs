import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const configPath = resolve(new URL("..", import.meta.url).pathname, "next.config.js");

function loadConfig(homeVersion) {
  if (homeVersion === undefined) {
    delete process.env.JAOTHUI_HOME_VERSION;
  } else {
    process.env.JAOTHUI_HOME_VERSION = homeVersion;
  }

  delete require.cache[configPath];
  return require(configPath);
}

async function redirectsFor(homeVersion) {
  const config = loadConfig(homeVersion);
  if (typeof config.redirects !== "function") {
    throw new Error("next.config.js must export a redirects() function");
  }

  return config.redirects();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const defaultRedirects = await redirectsFor(undefined);
assert(
  defaultRedirects.some(
    (redirect) => redirect.source === "/" && redirect.destination === "/v2" && redirect.permanent === false
  ),
  "Default home version must keep redirecting / to /v2"
);

const v2Redirects = await redirectsFor("v2");
assert(
  v2Redirects.some(
    (redirect) => redirect.source === "/" && redirect.destination === "/v2" && redirect.permanent === false
  ),
  "JAOTHUI_HOME_VERSION=v2 must redirect / to /v2"
);

const upperV1Redirects = await redirectsFor("V1");
assert(upperV1Redirects.length === 0, "JAOTHUI_HOME_VERSION=V1 must keep legacy / without redirect");

const v1Redirects = await redirectsFor("v1");
assert(v1Redirects.length === 0, "JAOTHUI_HOME_VERSION=v1 must keep legacy / without redirect");

console.log("HOME_VERSION_TOGGLE_CONTRACT_OK");
