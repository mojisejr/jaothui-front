import type { GetServerSideProps } from "next";
import Image from "next/image";

import { Spinner } from "../../../../components/v2";
import { buildMobileNativeCallbackErrorUrl, getSingleQueryValue, redirectNoStore } from "../../../../server/mobile/bitkub-next-routing";
import { completeMobileLineCallback } from "../../../../server/mobile/line-auth";

type MobileLineCallbackProps = {
  error?: string;
};

export const getServerSideProps: GetServerSideProps<MobileLineCallbackProps> =
  async ({ query, res }) => {
    const code = getSingleQueryValue(query.code);
    const state = getSingleQueryValue(query.state);
    const providerError = getSingleQueryValue(query.error);

    if (providerError) {
      redirectNoStore(res, buildMobileNativeCallbackErrorUrl(providerError));
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
      const callback = await completeMobileLineCallback({ code, state });
      redirectNoStore(res, callback.deepLink);
    } catch (error) {
      console.error(
        "Mobile LINE callback redirect failed:",
        error instanceof Error ? error.message : "unknown error"
      );
      redirectNoStore(res, buildMobileNativeCallbackErrorUrl("mobile_line_auth_failed"));
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
