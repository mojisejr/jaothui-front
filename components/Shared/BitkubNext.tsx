import { ReactBitkubNextOauth2 } from "@bitkub-blockchain/react-bitkubnext-oauth2";
import { FunctionComponent, PropsWithChildren } from "react";
import { TbPlugConnected } from "react-icons/tb";

const BitkubNextConnectButton: FunctionComponent<PropsWithChildren> = () => {
  const clientId =
    process.env.NODE_ENV == "production"
      ? (process.env.NEXT_PUBLIC_client_id_prod as string)
      : (process.env.NEXT_PUBLIC_client_id_dev as string);
  const redirectURI =
    process.env.NODE_ENV == "production"
      ? (process.env.NEXT_PUBLIC_redirect_prod as string)
      : (process.env.NEXT_PUBLIC_redirect_dev as string);
  return (
    //@ts-ignore
    <ReactBitkubNextOauth2
      clientId={clientId}
      redirectURI={redirectURI}
      mode="redirect"
    >
      <button className="btn-primary text-xs hover:text-base-200 hover:bg-accent flex gap-2 px-3 py-2 rounded-xl items-center border-[1px] border-thuiwhite">
        Connect Wallet
      </button>
    </ReactBitkubNextOauth2>
  );
};

export default BitkubNextConnectButton;
