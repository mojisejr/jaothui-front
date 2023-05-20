import {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";
import { exchangeAuthorizationCode } from "@bitkub-blockchain/react-bitkubnext-oauth2";
import axios from "axios";

import { useBitkubNext } from "../../hooks/bitkubNextContext";

const Callback: FunctionComponent<PropsWithChildren> = () => {
  const { updateLogin } = useBitkubNext();
  const { query, replace } = useRouter();
  const [message, setMessage] = useState("Authorizing...");

  useEffect(() => {
    if (!query.code) {
      setMessage("Authorization Failed..");
      replace("/");
    } else {
      setMessage("Authorization Successfully..!");
      getAccessToken(query.code as string);
    }
  }, [query]);

  async function getAccessToken(code: string) {
    const { access_token, refresh_token } = await exchangeAuthorizationCode(
      // process.env.NEXT_PUBLIC_client_id_dev as string,
      // process.env.NEXT_PUBLIC_redirect_dev as string,
      process.env.NEXT_PUBLIC_client_id_prod as string,
      process.env.NEXT_PUBLIC_redirect_prod as string,
      code as string
    );

    const response = await axios.get(
      "https://api.bitkubnext.io/accounts/auth/info",
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { wallet_address } = response.data.data;
    if (!wallet_address) {
      setMessage("no wallet found!");
      replace("/");
    } else {
      updateLogin(access_token, refresh_token, wallet_address);
      replace("/");
    }
  }

  return (
    <div className="bg-thuiyellow h-screen w-screeen flex justify-center items-center">
      <div className="text-[60px]">{message}</div>
    </div>
  );
};

export default Callback;
