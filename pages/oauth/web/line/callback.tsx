import type { GetServerSideProps } from "next";
import Image from "next/image";

import { Spinner } from "../../../../components/v2";
import { classifyLineWebAuthError } from "../../../../server/auth/line-web-auth";
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
      const result = await completeLineWebLogin({ code, state });
      setLineWebSessionCookie({ req, res }, result.session.token);
      console.info("LINE web callback completed", {
        hasDisplayName: Boolean(result.profile.displayName),
        hasEmail: Boolean(result.profile.email),
        hasLinkedWallet: Boolean(result.session.payload.linkedWallet),
      });

      return {
        redirect: {
          destination: result.returnTo,
          permanent: false,
        },
      };
    } catch (error) {
      const errorClass = classifyLineWebAuthError(error);
      console.warn("LINE web callback contract failed", { errorClass });
      res.statusCode = 400;
      return {
        props: {
          error: "Unable to complete LINE login",
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
