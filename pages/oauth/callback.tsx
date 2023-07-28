import {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";
import { exchangeAuthorizationCode } from "@bitkub-blockchain/react-bitkubnext-oauth2";

import { useBitkubNext } from "../../contexts/bitkubNextContext";
// import { useAuth } from "../../hooks/useAuth";
import Image from "next/image";
import { isEmpty } from "../../helpers/dataValidator";
import { getUserData } from "../../helpers/getUserData";
import { setCookies } from "../../helpers/setCookies";
import { trpc } from "../../utils/trpc";

const clientId =
  process.env.NODE_ENV == "production"
    ? (process.env.NEXT_PUBLIC_client_id_prod as string)
    : (process.env.NEXT_PUBLIC_client_id_dev as string);
const redirectUrl =
  process.env.NODE_ENV == "production"
    ? (process.env.NEXT_PUBLIC_redirect_prod as string)
    : (process.env.NEXT_PUBLIC_redirect_dev as string);

const Callback: FunctionComponent<PropsWithChildren> = () => {
  const { updateLogin } = useBitkubNext();
  const { mutate: save } = trpc.user.create.useMutation();

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
    //1. get AccessToken
    const { access_token, refresh_token } = await exchangeAuthorizationCode(
      clientId,
      redirectUrl,
      code as string
    );

    //2. get user data
    const userData = await getUserData(access_token);

    //3. check if logged in ?
    if (!userData.success && isEmpty(userData.wallet_address)) {
      //wallet not found
      setMessage("no wallet found!");
      replace("/");
    } else {
      //wallet founded
      save({
        wallet: userData.wallet_address as string,
        email: userData.email as string,
        name: null,
        tel: null,
      });
      setMessage("Loading Dashboard..");
      updateLogin(
        access_token,
        refresh_token,
        userData.wallet_address,
        userData.email
      );

      //set cookies
      setCookies(access_token, refresh_token, userData.wallet_address);

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
