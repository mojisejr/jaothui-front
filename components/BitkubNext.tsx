import { ReactBitkubNextOauth2 } from "@bitkub-blockchain/react-bitkubnext-oauth2";
import { FunctionComponent, PropsWithChildren } from "react";

const BitkubNextConnectButton: FunctionComponent<PropsWithChildren> = () => {
  return (
    //@ts-ignore
    <ReactBitkubNextOauth2
      // clientId={process.env.NEXT_PUBLIC_client_id_dev as string}
      // redirectURI={process.env.NEXT_PUBLIC_redirect_dev as string}
      clientId={process.env.NEXT_PUBLIC_client_prod as string}
      redirectURI={process.env.NEXT_PUBLIC_redirect_prod as string}
      mode="redirect"
    >
      <button
        className="bg-thuiyellow text-thuigray pl-[2%] pr-[2%] pt-[1%] pb-[1%] min-w-[100px] text-[15px] rounded-[30px]
                          tabletS:text-[30px]
                          tabletS:w-[250px]"
      >
        Connect Wallet
      </button>
    </ReactBitkubNextOauth2>
  );
};

export default BitkubNextConnectButton;
