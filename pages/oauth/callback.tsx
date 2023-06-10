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
// import { useAuth } from "../../hooks/useAuth";
import Image from "next/image";

const Callback: FunctionComponent<PropsWithChildren> = () => {
  const { updateLogin } = useBitkubNext();
  // const { save } = useAuth();
  const { query, replace } = useRouter();
  const [message, setMessage] = useState("Authorizing...");

  useEffect(() => {
    if (!query.code) {
      setMessage("Authenticating..!");
    } else {
      setMessage("Authorization Successfully..!");
      getAccessToken(query.code as string);
    }
  }, [query]);

  async function getAccessToken(code: string) {
    const { access_token, refresh_token } = await exchangeAuthorizationCode(
      process.env.NODE_ENV == "production"
        ? (process.env.NEXT_PUBLIC_client_id_prod as string)
        : (process.env.NEXT_PUBLIC_client_id_dev as string),
      process.env.NODE_ENV == "production"
        ? (process.env.NEXT_PUBLIC_redirect_prod as string)
        : (process.env.NEXT_PUBLIC_redirect_dev as string),
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

    const { wallet_address, email } = response.data.data;
    if (!wallet_address) {
      setMessage("no wallet found!");
      replace("/");
    } else {
      setMessage("Loading Dashboard..");
      updateLogin(access_token, refresh_token, wallet_address, email);
      // await save({ wallet: wallet_address, refreshToken: refresh_token });
      replace("/cert/profile");
    }
  }

  return (
    <div className="bg-thuiyellow h-screen w-screeen flex flex-col justify-center items-center p-10">
      <Image src="/images/First1.png" width={350} height={350} alt="thui" />
      <div className="text-[20px]">{message}</div>
    </div>
  );
};

export default Callback;
