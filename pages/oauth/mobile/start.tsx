import type { GetServerSideProps } from "next";
import Image from "next/image";
import { classifyAuthFailure, logAuthStage } from "../../../server/auth/diagnostics";
import { getAuthRequestId } from "../../../server/auth/request-id";

import {
  buildBitkubNextAuthorizeUrl,
  createMobileOAuthState,
  normalizeMobileReturnTo,
} from "../../../server/mobile/bitkub-next-auth";

type MobileStartProps = {
  error?: string;
};

function getSingleQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const getServerSideProps: GetServerSideProps<MobileStartProps> = async ({
  query,
  req,
  res,
}) => {
  const requestedReturnTo =
    getSingleQueryValue(query.returnTo) ?? "jaothui://oauth/callback";

  try {
    const returnTo = normalizeMobileReturnTo(requestedReturnTo);
    const state = createMobileOAuthState(returnTo);

    return {
      redirect: {
        destination: buildBitkubNextAuthorizeUrl(state),
        permanent: false,
      },
    };
  } catch (error) {
    const failure = classifyAuthFailure(error);
    logAuthStage({ requestId: getAuthRequestId(req), flow: "mobile_legacy", stage: "configuration", outcome: "failed", error });
    res.statusCode = failure.status === 401 ? 400 : failure.status;
    return {
      props: {
        error: "Unable to start mobile authentication. Please try again.",
      },
    };
  }
};

export default function MobileOauthStart({ error }: MobileStartProps) {
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
        {error ?? "Preparing Bitkub NEXT authentication..."}
      </div>
    </div>
  );
}
