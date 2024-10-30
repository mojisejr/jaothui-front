import "../styles/globals.css";
import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { WagmiConfig, configureChains, createClient } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { publicProvider } from "wagmi/providers/public";
import { bitkub_mainnet, bitkub_testnet } from "../blockchain/chain";
import { MenuProvider } from "../contexts/menuContext";
import { BitkubNextProvider } from "../contexts/bitkubNextContext";
import { NewAssetProvider } from "../contexts/newAssetContext";
import { trpc } from "../utils/trpc";

import { QueryClient } from "@tanstack/react-query";

import StoreProvider from "../contexts/storeContext";
import { PrivilegeProvider } from "../contexts/privilegeContext";
import { useRouter } from "next/router";

const queryClient = new QueryClient();

const { chains, provider } = configureChains(
  [bitkub_mainnet],
  [publicProvider()]
);

// const { connectors } = getDefaultWallets({
//   appName: "JAOTHUI NFT",
//   chains,
// });

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
    }),
  ],
  provider,
});

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  const [showChild, setShowChild] = useState(false);
  useEffect(() => {
    const handleStart = () => {
      setShowChild(true);
    };
    const handleComplete = () => {
      setShowChild(true);
    };

    setShowChild(true);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);
  }, []);

  if (!showChild) {
    return null;
  }

  if (typeof window === "undefined") {
    return <></>;
  } else {
    return (
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <StoreProvider>
            <BitkubNextProvider>
              <MenuProvider>
                <NewAssetProvider>
                  <PrivilegeProvider>
                    <Component {...pageProps} />
                  </PrivilegeProvider>
                </NewAssetProvider>
              </MenuProvider>
            </BitkubNextProvider>
          </StoreProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    );
  }
};

export default trpc.withTRPC(MyApp);
