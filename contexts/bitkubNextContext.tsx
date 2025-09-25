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
    // Only try to get user data if there's an access_token cookie
    const checkAndGetUserData = () => {
      // Check if access_token cookie exists
      const cookies = document.cookie;
      const hasAccessToken = cookies.includes('access_token=');
      
      if (hasAccessToken) {
        getUserDataFromCookies();
      } else {
        // No access token, set as disconnected
        setIsConnected(false);
      }
    };

    checkAndGetUserData();
  }, []);

  //get user data from cookies via /api/auth/me
  const getUserDataFromCookies = async () => {
    try {
      // Call our /api/auth/me endpoint to get user data from cookies
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        setIsConnected(false);
        return;
      }

      const userData = await response.json();

      if (userData.success && userData.wallet_address) {
        setWalletAddress(userData.wallet_address as `0x${string}`);
        setEmail(userData.email || "");
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
