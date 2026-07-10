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
import {
  buildMobileCallbackPagePath,
  getMobileStateHint,
  getSingleQueryValue,
} from "../../server/mobile/bitkub-next-routing";

const clientId =
  process.env.NODE_ENV == "production"
    ? (process.env.NEXT_PUBLIC_client_id_prod as string)
    : (process.env.NEXT_PUBLIC_client_id_dev as string);
const redirectUrl =
  process.env.NODE_ENV == "production"
    ? (process.env.NEXT_PUBLIC_redirect_prod as string)
    : (process.env.NEXT_PUBLIC_redirect_dev as string);

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const code = getSingleQueryValue(query.code);
  const state = getSingleQueryValue(query.state);

  if (!code || !state || !getMobileStateHint(state)) {
    return { props: {} };
  }

  return {
    redirect: {
      destination: buildMobileCallbackPagePath({ code, state }),
      permanent: false,
    },
  };
};

const Callback: FunctionComponent<PropsWithChildren> = () => {
  const { loggedIn } = useBitkubNext();
  const { mutate: save } = trpc.user.create.useMutation();

  const { query, replace } = useRouter();
  const [message, setMessage] = useState("Authorizing...");

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
      setMessage("Returning to JAOTHUI mobile...");
      window.location.replace(buildMobileCallbackPagePath({ code, state }));
    } else {
      getAccessToken(code);
    }
  }, [getAccessToken, query]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background p-10 text-foreground">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-pill bg-gradient-ring p-[2px]">
        <div className="flex h-full w-full items-center justify-center rounded-pill bg-background">
          <Image src="/images/thuiLogo.png" alt="เจ้าทุย" width={56} height={56} className="h-14 w-14 object-contain" />
        </div>
      </div>
      <Spinner size="md" />
      <div className="font-semibold text-muted">{message}</div>
    </div>
  );
};

export default Callback;
