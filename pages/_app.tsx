import "../styles/globals.css";
import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { WagmiConfig, configureChains, createClient, mainnet } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { bitkub_mainnet, bitkub_testnet } from "../blockchain/chain";
import { MenuProvider } from "../hooks/menuContext";
import { CertProvider } from "../hooks/cert/certContext";
import { BitkubNextProvider } from "../hooks/bitkubNextContext";

const { chains, provider } = configureChains(
  [bitkub_testnet],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "JAOTHUI NFT",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
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
              <CertProvider>
                <Component {...pageProps} />
              </CertProvider>
            </MenuProvider>
          </BitkubNextProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    );
  }
}

export default MyApp;
