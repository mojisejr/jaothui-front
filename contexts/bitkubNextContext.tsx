import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { exchangeRefreshToken } from "@bitkub-blockchain/react-bitkubnext-oauth2";
import { getUserData } from "../helpers/getUserData";
import { trpc } from "../utils/trpc";

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
    getUserDataFromCookies();
  }, []);

  //get user data from cookies via /api/auth/token
  const getUserDataFromCookies = async () => {
    try {
      // Call our /api/auth/token endpoint to get tokens from cookies
      const response = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        setIsConnected(false);
        return;
      }

      const { access_token } = await response.json();

      if (!access_token) {
        setIsConnected(false);
        return;
      }

      // Get user data using the access token
      const userData = await getUserData(access_token);

      if (userData.success) {
        setWalletAddress(userData.wallet_address as `0x${string}`);
        setEmail(userData.email);
        setIsConnected(true);
      } else {
        setWalletAddress("");
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error getting user data from cookies:', error);
      setWalletAddress("");
      setIsConnected(false);
    }
  };

  function loggedIn() {
    // Refresh user data from cookies after login
    getUserDataFromCookies();
  }

  async function disconnect() {
    try {
      // Call logout endpoint to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    // Clear local state
    setWalletAddress("");
    setEmail("");
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
