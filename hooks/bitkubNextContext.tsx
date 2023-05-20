import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { exchangeRefreshToken } from "@bitkub-blockchain/react-bitkubnext-oauth2";

type bitkubNextContextType = {
  isConnected: boolean;
  walletAddress: `0x${string}`;
  disconnect: () => void;
  updateLogin: (
    accessToken: string,
    refreshToken: string,
    walletAddress: `0x${string}`
  ) => void;
  refreshAccessToken: () => void;
};

const bitkubNextContextDefaultValue: bitkubNextContextType = {
  isConnected: false,
  walletAddress: "0x00",
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
  const [walletAddress, setWalletAddress] = useState<`0x${string}`>("0x00");

  useEffect(() => {
    if (walletAddress == "0x00" || accessToken == "none") {
      setIsConnected(false);
    }

    if (walletAddress != "0x00") {
      console.log("wallet != 0x00");
      setIsConnected(true);
    }
  }, [accessToken, refreshToken, walletAddress]);

  function updateLogin(
    accessToken: string,
    refreshToken: string,
    walletAddress: `0x${string}`
  ) {
    console.log("login: ", {
      accessToken,
      refreshToken,
      walletAddress,
      isConnected,
    });
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setWalletAddress(walletAddress);
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
    setWalletAddress("0x00");
  }

  const value = {
    walletAddress,
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
