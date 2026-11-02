import type { GetServerSideProps } from "next";
import { attachStateHint, completeLineAttach } from "../../../../server/auth/event-sso-line-attach";
import { establishBrowser, EventSsoError, hash, ssoEnabled, ssoFailure } from "../../../../server/auth/event-sso";
import { getCookie, setCookie } from "cookies-next";
import Image from "next/image";

import { Spinner } from "../../../../components/v2";
import { classifyAuthFailure, logAuthStage } from "../../../../server/auth/diagnostics";
import { getAuthRequestId } from "../../../../server/auth/request-id";
import { completeLineWebLogin } from "../../../../server/auth/line-web-login";
import { setLineWebSessionCookie } from "../../../../server/auth/line-web-session";

type LineWebCallbackProps = {
  error?: string;
  displayName?: string | null;
};

function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const getServerSideProps: GetServerSideProps<LineWebCallbackProps> =
  async ({ query, req, res }) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");

    const providerError = getSingleQueryValue(query.error);
    if (providerError) {
      res.statusCode = 400;
      return {
        props: {
          error: "LINE login was cancelled or denied",
        },
      };
    }

    const code = getSingleQueryValue(query.code);
    const state = getSingleQueryValue(query.state);
    if (!code || !state) {
      res.statusCode = 400;
      return {
        props: {
          error: "Invalid LINE login callback",
        },
      };
    }

    try {
      if (attachStateHint(state)) {
        const returnTo = await completeLineAttach({ req, res }, { code, state });
        return { redirect: { destination: returnTo, permanent: false } };
      }
      if (ssoEnabled() && getCookie("jaothui_line_login_state", { req, res }) !== hash(state)) throw new EventSsoError(401, "LOGIN_STATE_MISMATCH");
      const result = await completeLineWebLogin({ code, state });
      if (ssoEnabled()) {
        await establishBrowser({ req, res }, { accountId: result.account.id, credentialKind: "line", credentialSubject: result.profile.providerUserId, credentialHash: hash(result.session.token), expiresAt: new Date(result.session.expiresAt * 1000) });
        setCookie("jaothui_line_login_state", "", { req, res, path: "/", httpOnly: true, maxAge: 0, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
        // Explicit successful login selects this account. Remove stale wallet auth.
        for (const name of ["session_token", "access_token", "refresh_token"]) setCookie(name, "", { req, res, path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0 });
      }
      setLineWebSessionCookie({ req, res }, result.session.token);
      logAuthStage({ requestId: getAuthRequestId(req), flow: "web_line", stage: "callback", outcome: "completed" });

      return {
        redirect: {
          destination: result.returnTo,
          permanent: false,
        },
      };
    } catch (error) {
      const failure = classifyAuthFailure(error);
      logAuthStage({ requestId: getAuthRequestId(req), flow: "web_line", stage: "callback", outcome: "failed", error });
      res.statusCode = ssoEnabled() && error instanceof EventSsoError ? error.status : attachStateHint(state) ? ssoFailure(error).status : failure.status === 401 ? 400 : failure.status;
      return {
        props: {
          error: attachStateHint(state) && ssoFailure(error).status === 409 ? "LINE นี้เชื่อมกับบัญชีอื่นแล้ว กรุณาตรวจสอบบัญชีเดิม ระบบไม่ได้สลับหรือรวมบัญชีให้" : "Unable to complete LINE login",
        },
      };
    }
  };

export default function LineWebCallback({
  error,
  displayName,
}: LineWebCallbackProps) {
  const message = error
    ? error
    : displayName
      ? `LINE account verified: ${displayName}`
      : "LINE account verified";

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background p-10 text-center text-foreground">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-pill bg-gradient-ring p-[2px]">
        <div className="flex h-full w-full items-center justify-center rounded-pill bg-background">
          <Image
            src="/images/thuiLogo.png"
            alt="เจ้าทุย"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
          />
        </div>
      </div>
      {error ? null : <Spinner size="md" />}
      <div className="max-w-md font-semibold text-muted">{message}</div>
    </div>
  );
}
