import type { GetServerSidePropsContext } from "next";

const MOBILE_CALLBACK_PATH = "/oauth/mobile/callback";
const MOBILE_NATIVE_CALLBACK_URL = "jaothui://oauth/callback";

function decodeBase64UrlJson(payload: string) {
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  if (typeof window !== "undefined") {
    return JSON.parse(window.atob(padded));
  }

  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

export function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getMobileStateHint(state: string) {
  try {
    const payload = state.split(".")[1];
    if (!payload) return false;

    const decoded = decodeBase64UrlJson(payload);

    return (
      decoded?.typ === "jaothui-mobile-oauth-state" &&
      decoded?.flow === "mobile"
    );
  } catch {
    return false;
  }
}

export function buildMobileCallbackPagePath(input: {
  code: string;
  state: string;
}) {
  const params = new URLSearchParams({
    code: input.code,
    state: input.state,
  });
  return `${MOBILE_CALLBACK_PATH}?${params.toString()}`;
}

export function buildMobileNativeCallbackErrorUrl(error: string) {
  const url = new URL(MOBILE_NATIVE_CALLBACK_URL);
  url.searchParams.set("error", error);
  return url.toString();
}

export function redirectNoStore(
  res: GetServerSidePropsContext["res"],
  location: string
) {
  res.statusCode = 302;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", location);
  res.end();
}
