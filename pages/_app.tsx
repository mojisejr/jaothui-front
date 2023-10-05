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
import StoreProvider from "../contexts/storeContext";

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
  const [showChild, setShowChild] = useState(false);
  useEffect(() => {
    setShowChild(true);
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
          <BitkubNextProvider>
            <MenuProvider>
              <NewAssetProvider>
                <StoreProvider>
                  <Component {...pageProps} />
                </StoreProvider>
              </NewAssetProvider>
            </MenuProvider>
          </BitkubNextProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    );
  }
};

export default trpc.withTRPC(MyApp);
