import type { GetServerSideProps } from "next";
import Image from "next/image";

import { Spinner } from "../../../../components/v2";
import { buildMobileNativeCallbackErrorUrl, getSingleQueryValue, redirectNoStore } from "../../../../server/mobile/bitkub-next-routing";
import { completeLineLinkCallback, isMobileLineLinkState, cancelLineLinkCallback } from "../../../../server/mobile/line-link";
import { completeMobileLineCallback } from "../../../../server/mobile/line-auth";
import { classifyAuthFailure, logAuthStage } from "../../../../server/auth/diagnostics";
import { getAuthRequestId } from "../../../../server/auth/request-id";

type MobileLineCallbackProps = {
  error?: string;
};

export const getServerSideProps: GetServerSideProps<MobileLineCallbackProps> =
  async ({ query, req, res }) => {
    const requestId = getAuthRequestId(req);
    const code = getSingleQueryValue(query.code);
    const state = getSingleQueryValue(query.state);
    const providerError = getSingleQueryValue(query.error);

    if (providerError) {
      const url = new URL(buildMobileNativeCallbackErrorUrl(providerError === "access_denied" ? "access_denied" : "mobile_line_auth_failed"));
      if (state && isMobileLineLinkState(state)) {
        url.searchParams.set("purpose", "link");
        try { await cancelLineLinkCallback(state); } catch {}
      }
      redirectNoStore(res, url.toString());
      return { props: {} };
    }

    if (!code || !state) {
      res.statusCode = 400;
      return {
        props: {
          error: "Invalid mobile LINE authentication callback",
        },
      };
    }

    try {
      if (isMobileLineLinkState(state)) redirectNoStore(res, await completeLineLinkCallback({ code, state }));
      else {
        const callback = await completeMobileLineCallback({ code, state, requestId });
        redirectNoStore(res, callback.deepLink);
      }
    } catch (error) {
      logAuthStage({ requestId, flow: "mobile_line", stage: "callback", outcome: "failed", error });
      const errorCode = classifyAuthFailure(error).status === 503 ? "mobile_line_service_unavailable" : "mobile_line_auth_failed";
      const url = new URL(buildMobileNativeCallbackErrorUrl(errorCode));
      if (isMobileLineLinkState(state)) url.searchParams.set("purpose", "link");
      redirectNoStore(res, url.toString());
    }

    return { props: {} };
  };

export default function MobileLineOauthCallback({ error }: MobileLineCallbackProps) {
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
      <div className="max-w-md font-semibold text-muted">
        {error ?? "Returning to JAOTHUI mobile..."}
      </div>
    </div>
  );
}
