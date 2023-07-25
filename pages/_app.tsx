import "../styles/globals.css";
import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { WagmiConfig, configureChains, createClient } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { publicProvider } from "wagmi/providers/public";
import { bitkub_mainnet, bitkub_testnet } from "../blockchain/chain";
import { MenuProvider } from "../hooks/menuContext";
import { BitkubNextProvider } from "../hooks/bitkubNextContext";
import { NewAssetProvider } from "../hooks/newAssetContext";

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

function MyApp({ Component, pageProps }: AppProps) {
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
                <Component {...pageProps} />
              </NewAssetProvider>
            </MenuProvider>
          </BitkubNextProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    );
  }
}

export default MyApp;
