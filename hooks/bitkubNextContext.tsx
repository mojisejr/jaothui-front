import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { exchangeRefreshToken } from "@bitkub-blockchain/react-bitkubnext-oauth2";
import { useCookies } from "react-cookie";

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
  const [cookies, setCookie, removeCookie] = useCookies(["access_token"]);

  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (walletAddress == "" || accessToken == "none") {
      setIsConnected(false);
    }

    if (walletAddress != "" && isConnected) {
      setIsConnected(true);
      setCookie("access_token", accessToken);
    }
  }, [accessToken, refreshToken, walletAddress, isConnected]);

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
