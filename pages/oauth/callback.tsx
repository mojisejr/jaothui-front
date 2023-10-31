import {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";
import { exchangeAuthorizationCode, exchangeRefreshToken } from "@bitkub-blockchain/react-bitkubnext-oauth2";

import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { isEmpty } from "../../helpers/dataValidator";
import { getUserData } from "../../helpers/getUserData";
import { setCookies } from "../../helpers/setCookies";
import { trpc } from "../../utils/trpc";
import Loading from "../../components/Shared/Indicators/Loading";

const clientId =
  process.env.NODE_ENV == "production"
    ? (process.env.NEXT_PUBLIC_client_id_prod as string)
    : (process.env.NEXT_PUBLIC_client_id_dev as string);
const redirectUrl =
  process.env.NODE_ENV == "production"
    ? (process.env.NEXT_PUBLIC_redirect_prod as string)
    : (process.env.NEXT_PUBLIC_redirect_dev as string);

const Callback: FunctionComponent<PropsWithChildren> = () => {
  const { loggedIn } = useBitkubNext();
  const { mutate: save } = trpc.user.create.useMutation();

  const { query, replace } = useRouter();
  const [message, setMessage] = useState("Authorizing...");
  useEffect(() => {
    if (!query.code) {
      setMessage("Authenticating...");
    } else {
      getAccessToken(query.code as string);
    }
  }, [query]);

  async function getAccessToken(code: string) {
    //1. get accessTokenFrom storage
    //2. check if access token is valid
    //3. if valid then set to storage
    //4. if not valid get new access token
      const newTokens = await exchangeAuthorizationCode(clientId, redirectUrl, code as string);
      localStorage.setItem('bkc_at', newTokens.access_token);
      localStorage.setItem('bkc_rt', newTokens.refresh_token);
      const userData = await getUserData(localStorage.getItem('bkc_at')!);
      if(userData.success) {
        setMessage("Authentication Successful.");
        localStorage.setItem('bkc_wallet', userData.wallet_address);
        localStorage.setItem('bkc_email', userData.email);
        save({
          wallet: userData.wallet_address as string,
          email: userData.email as string,
          name: null,
          tel: null,
          });
        loggedIn();
        setCookies(localStorage.getItem('bkc_at')!, localStorage.getItem('bkc_rt')!, userData.wallet_address); 
        setMessage("Loading Dashboard...");
        replace("/cert/profile");
      } else if(!userData.success) {
        setMessage("Authentication Failed.");
        localStorage.setItem('bkc_wallet', '');
        localStorage.setItem('bkc_email', '');
        replace("/");
      }
  }

  return (
    <div className="bg-base-200 h-screen w-screeen flex flex-col justify-center items-center p-10">
      <Loading size="lg" />
      <div className="font-bold">{message}</div>
    </div>
  );
};

export default Callback;
