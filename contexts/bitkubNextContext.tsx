import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { exchangeRefreshToken } from "@bitkub-blockchain/react-bitkubnext-oauth2";
import { deleteCookies } from "../helpers/clearCookies";
import { getUserData } from "../helpers/getUserData";
import { getCookies } from "cookies-next";
import { isEmpty } from "../helpers/dataValidator";

type bitkubNextContextType = {
  isConnected: boolean;
  walletAddress: `0x${string}` | "";
  email?: string;
  disconnect: () => void;
  updateLogin: (
    accessToken: string,
    refreshToken: string,
    walletAddress: `0x${string}`,
    email: string
  ) => void;
  refreshAccessToken: () => void;
};

const bitkubNextContextDefaultValue: bitkubNextContextType = {
  isConnected: false,
  walletAddress: "",
  disconnect: () => {},
  updateLogin: () => {},
  refreshAccessToken: () => {},
};

const BitkubNextContext = createContext<bitkubNextContextType>(
  bitkubNextContextDefaultValue
);

type Props = {
  children: ReactNode;
};

export function BitkubNextProvider({ children }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("none");
  const [refreshToken, setRefreshToken] = useState<string>("none");
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | "">(
    "0x00"
  );

  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (walletAddress == "" || accessToken == "none") {
      //in case of refresh token is available
      getUserDataFromAccessToken();
    }

    if (walletAddress != "" && isConnected && accessToken != "none") {
      setIsConnected(true);
    }
  }, [accessToken, refreshToken, walletAddress, isConnected]);

  async function getUserDataFromAccessToken() {
    const { access_token, refresh_token, wallet } = getCookies();
    // console.log("access token from cookies: ", {
    //   accessToken,
    //   refresh_token,
    //   wallet,
    // });

    const userData = await getUserData(access_token!);
    // console.log("user data from cookie's access token", userData);

    if (
      userData.success &&
      !isEmpty(userData.wallet_address) &&
      userData.wallet_address == wallet
    ) {
      // console.log("cookie is useable setting data to hooks");
      setWalletAddress(userData.wallet_address);
      setAccessToken(access_token!);
      setRefreshToken(refresh_token!);
      setEmail(userData.email);
      setIsConnected(true);
    } else if (!isEmpty(refresh_token)) {
      // check if refresh token is OK ?
      // console.log("cookie is invalid starting exchangeRefreshToken");
      try {
        const refreshedTokens = await exchangeRefreshToken(
          process.env.NEXT_PUBLIC_client_id_dev as string,
          refresh_token!
        );
        // console.log("refreshed Token: ", refreshedTokens);

        if (isEmpty(refreshedTokens)) {
          // console.log("somthing went wrong cannot find any refreshing tokens");
          setIsConnected(false);
        } else {
          // console.log("refreshed token success fetching user data");
          const userData = await getUserData(refreshedTokens.access_token);
          if (
            userData.success &&
            !isEmpty(userData.wallet_address) &&
            userData.wallet_address == wallet
          ) {
            // console.log("user data found from refreshed tokens");
            setWalletAddress(userData.wallet_address);
            setAccessToken(refreshedTokens.access_token!);
            setRefreshToken(refreshedTokens.refresh_token!);
            setEmail(userData.email);
            setIsConnected(true);
          } else {
            // console.log("user data not found from refresh token");
            setIsConnected(false);
          }
        }
      } catch (error) {
        // console.log("invalid refresh token or token expired");
        setIsConnected(false);
      }
    } else {
      setIsConnected(false);
    }
  }

  function updateLogin(
    accessToken: string,
    refreshToken: string,
    walletAddress: `0x${string}`,
    email: string
  ) {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setWalletAddress(walletAddress);
    setEmail(email);
    setIsConnected(true);
  }

  async function refreshAccessToken() {
    const { access_token, refresh_token } = await exchangeRefreshToken(
      process.env.NEXT_PUBLIC_client_id_dev as string,
      refreshToken
    );

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setIsConnected(true);
  }

  function disconnect() {
    setAccessToken("none");
    setRefreshToken("none");
    setWalletAddress("");
    deleteCookies();
    setIsConnected(false);
  }

  const value = {
    walletAddress,
    email,
    isConnected,
    updateLogin,
    disconnect,
    refreshAccessToken,
  };

  return (
    <BitkubNextContext.Provider value={value}>
      {children}
    </BitkubNextContext.Provider>
  );
}

export function useBitkubNext() {
  return useContext(BitkubNextContext);
}
