import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { exchangeRefreshToken } from "@bitkub-blockchain/react-bitkubnext-oauth2";
import { getUserData } from "../helpers/getUserData";

import { useRouter } from "next/router";

type bitkubNextContextType = {
  isConnected: boolean;
  walletAddress: `0x${string}` | "";
  email?: string;
  disconnect: () => void;
  loggedIn: () => void;
};

const bitkubNextContextDefaultValue: bitkubNextContextType = {
  isConnected: false,
  walletAddress: "",
  disconnect: () => {},
  loggedIn: () => {},
};

const BitkubNextContext = createContext<bitkubNextContextType>(
  bitkubNextContextDefaultValue
);

type Props = {
  children: ReactNode;
};

export function BitkubNextProvider({ children }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | "">(
    "0x00"
  );

  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const wallet = localStorage.getItem("bkc_wallet");
    setWalletAddress(wallet as `0x${string}`);

    getUserDataFromRefreshToken();
  }, [isConnected]);

  //get user from refresh token
  const getUserDataFromRefreshToken = async () => {
    const accessToken = localStorage.getItem("bkc_at");
    const refreshToken = localStorage.getItem("bkc_rt");

    if (accessToken == undefined || refreshToken == undefined) {
      setIsConnected(false);
    } else {
      const userData = await getUserData(accessToken!);
      if (userData.success) {
        localStorage.setItem("bkc_wallet", userData.wallet_address);
        localStorage.setItem("bkc_email", userData.email);
        setIsConnected(true);
        return;
      }
    }

    const tokens = await exchangeRefreshToken(
      process.env.NEXT_PUBLIC_client_id_dev as string,
      refreshToken!
    );

    if (tokens.access_token == undefined || tokens.refresh_token == undefined) {
      setIsConnected(false);
    }

    const userData = await getUserData(tokens.access_token!);

    if (userData.success) {
      localStorage.setItem("bkc_wallet", userData.wallet_address);
      localStorage.setItem("bkc_email", userData.email);
      setWalletAddress(userData.wallet_address!);
      setIsConnected(true);
    } else if (!userData.success) {
      setWalletAddress("");
      setIsConnected(false);
    }
  };

  function loggedIn() {
    const wallet = localStorage.getItem("bkc_wallet");
    setWalletAddress(wallet as `0x${string}`);
    setIsConnected(true);
  }

  function disconnect() {
    localStorage.removeItem("bkc_wallet");
    localStorage.removeItem("bkc_email");
    localStorage.removeItem("bkc_at");
    localStorage.removeItem("bkc_rt");
    localStorage.removeItem("customer");
    setIsConnected(false);
  }

  const value = {
    walletAddress,
    email,
    isConnected,
    loggedIn,
    disconnect,
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
