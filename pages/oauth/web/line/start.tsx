import type { GetServerSideProps } from "next";
import Image from "next/image";

import {
  buildLineWebAuthorizeUrl,
  createWebLineOAuthState,
  normalizeWebLineReturnTo,
} from "../../../../server/auth/line-web-auth";

type LineWebStartProps = {
  error?: string;
};

function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const getServerSideProps: GetServerSideProps<LineWebStartProps> = async ({
  query,
  res,
}) => {
  try {
    const returnTo = normalizeWebLineReturnTo(getSingleQueryValue(query.returnTo));
    const { state, payload } = createWebLineOAuthState(returnTo);

    return {
      redirect: {
        destination: buildLineWebAuthorizeUrl({
          state,
          nonce: payload.nonce,
        }),
        permanent: false,
      },
    };
  } catch (error) {
    res.statusCode = 400;
    return {
      props: {
        error:
          error instanceof Error ? error.message : "Unable to start LINE login",
      },
    };
  }
};

export default function LineWebStart({ error }: LineWebStartProps) {
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
      <div className="max-w-md font-semibold text-muted">
        {error ?? "Preparing LINE login..."}
      </div>
    </div>
  );
}
