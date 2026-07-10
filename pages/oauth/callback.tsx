import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import {
  exchangeAuthorizationCode,
} from "@bitkub-blockchain/react-bitkubnext-oauth2";

import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { isEmpty } from "../../helpers/dataValidator";
import { getUserData } from "../../helpers/getUserData";
import { setCookies } from "../../helpers/setCookies";
import { trpc } from "../../utils/trpc";
import Image from "next/image";
import { Spinner } from "../../components/v2";
import { createMobileBitkubNextDeepLink } from "../../server/mobile/bitkub-next-handoff";

const clientId =
  process.env.NODE_ENV == "production"
    ? (process.env.NEXT_PUBLIC_client_id_prod as string)
    : (process.env.NEXT_PUBLIC_client_id_dev as string);
const redirectUrl =
  process.env.NODE_ENV == "production"
    ? (process.env.NEXT_PUBLIC_redirect_prod as string)
    : (process.env.NEXT_PUBLIC_redirect_dev as string);

function decodeBase64UrlJson(payload: string) {
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  if (typeof window === "undefined") {
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  }

  return JSON.parse(window.atob(padded));
}

function getMobileStateHint(state: string) {
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

function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildMobileCallbackErrorUrl(error: string) {
  const url = new URL("jaothui://oauth/callback");
  url.searchParams.set("error", error);
  return url.toString();
}

function redirectToNativeCallback(
  res: Parameters<GetServerSideProps>[0]["res"],
  location: string
) {
  res.statusCode = 302;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", location);
  res.end();
}

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const code = getSingleQueryValue(query.code);
  const state = getSingleQueryValue(query.state);

  if (!code || !state || !getMobileStateHint(state)) {
    return { props: {} };
  }

  try {
    redirectToNativeCallback(
      res,
      await createMobileBitkubNextDeepLink({ code, state })
    );
  } catch (error) {
    console.error(
      "Mobile Bitkub NEXT callback redirect failed:",
      error instanceof Error ? error.message : "unknown error"
    );
    redirectToNativeCallback(
      res,
      buildMobileCallbackErrorUrl("mobile_auth_failed")
    );
  }

  return { props: {} };
};

const Callback: FunctionComponent<PropsWithChildren> = () => {
  const { loggedIn } = useBitkubNext();
  const { mutate: save } = trpc.user.create.useMutation();

  const { query, replace } = useRouter();
  const [message, setMessage] = useState("Authorizing...");
  const [mobileDeepLink, setMobileDeepLink] = useState<string | null>(null);

  const getMobileHandoff = useCallback(async (code: string, state: string) => {
    setMessage("Returning to JAOTHUI mobile...");

    try {
      const response = await fetch("/api/oauth/mobile/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state }),
      });
      const result = await response.json();

      if (response.ok && result.success && result.deepLink) {
        setMobileDeepLink(result.deepLink);
        setMessage("Opening JAOTHUI mobile...");
        window.location.replace(result.deepLink);
        window.setTimeout(() => {
          setMessage("Tap Open JAOTHUI mobile to continue.");
        }, 1200);
        return;
      }
    } catch (error) {
      console.error(
        "Mobile Bitkub NEXT handoff request failed:",
        error instanceof Error ? error.message : "unknown error"
      );
    }

    setMessage("Mobile Authentication Failed.");
    replace("/v2/profile?mobile_auth=failed");
  }, [replace]);

  const getAccessToken = useCallback(async (code: string) => {
    const newTokens = await exchangeAuthorizationCode(
      clientId,
      redirectUrl,
      code as string
    );
    // Do not store tokens client-side; send them to server to set HttpOnly cookies
    const userData = await getUserData(newTokens.access_token);
    if (userData.success) {
      setMessage("Authentication Successful.");
      // Persist wallet/email for UI convenience
      localStorage.setItem("bkc_wallet", userData.wallet_address);
      localStorage.setItem("bkc_email", userData.email);
      save({
        wallet: userData.wallet_address as string,
        email: userData.email as string,
        name: null,
        tel: null,
      });
      loggedIn();
      // Server-side cookie issuance: validate access_token, issue session JWT, and set HttpOnly cookies.
      await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
        }),
      });
      setMessage("Loading Dashboard...");
      // Return-to override (additive): a page can set `bkc_post_login` before the OAuth
      // redirect to land back on itself (e.g. /v2/profile). Legacy default stays "/profile".
      const returnTo = localStorage.getItem("bkc_post_login");
      localStorage.removeItem("bkc_post_login");
      replace(returnTo && returnTo.startsWith("/") ? returnTo : "/profile");
    } else if (!userData.success) {
      setMessage("Authentication Failed.");
      localStorage.setItem("bkc_wallet", "");
      localStorage.setItem("bkc_email", "");
      replace("/");
    }
  }, [loggedIn, replace, save]);

  useEffect(() => {
    const code = typeof query.code === "string" ? query.code : undefined;
    const state = typeof query.state === "string" ? query.state : undefined;

    if (!code) {
      setMessage("Authenticating...");
    } else if (state && getMobileStateHint(state)) {
      getMobileHandoff(code, state);
    } else {
      getAccessToken(code);
    }
  }, [getAccessToken, getMobileHandoff, query]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background p-10 text-foreground">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-pill bg-gradient-ring p-[2px]">
        <div className="flex h-full w-full items-center justify-center rounded-pill bg-background">
          <Image src="/images/thuiLogo.png" alt="เจ้าทุย" width={56} height={56} className="h-14 w-14 object-contain" />
        </div>
      </div>
      <Spinner size="md" />
      <div className="font-semibold text-muted">{message}</div>
      {mobileDeepLink ? (
        <a
          className="rounded-pill bg-accent px-6 py-3 font-semibold text-background"
          href={mobileDeepLink}
        >
          Open JAOTHUI mobile
        </a>
      ) : null}
    </div>
  );
};

export default Callback;
