import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { CertNFTRawData } from "../../blockchain/cert/interface";
import { useGetInfosOf } from "../../blockchain/cert/read";
import { useAccount } from "wagmi";

type CertContextType = {
  certNFTs: CertNFTRawData[] | [];
  getNFTMicrochip: (microhip: string) => CertNFTRawData | {};
  refetchCert: (from: string) => void;
};

const certContextDefaultValue: CertContextType = {
  certNFTs: [],
  getNFTMicrochip: () => ({}),
  refetchCert: () => {},
};

const CertContext = createContext<CertContextType>(certContextDefaultValue);

type Props = {
  children: ReactNode;
};

export const CertProvider = ({ children }: Props) => {
  const [certNFTs, setNft] = useState<CertNFTRawData[] | []>([]);
  const { isConnected, address } = useAccount();
  const { infos, refetchInfo } = useGetInfosOf(address!);

  useEffect(() => {
    if (!isConnected) {
      setNft([]);
    }
    if (address) {
      refetchInfo();
      setNft(infos!);
    }
  }, [isConnected, address]);

  const getNFTMicrochip = (microchip: string) => {
    const found = infos!.find((m: CertNFTRawData) => m.microchip == microchip);
    return found ? found : {};
  };

  const refetchCert = (from: string) => {
    console.log(`refetch cert from ${from}`);
    refetchInfo();
  };

  const value = {
    certNFTs,
    getNFTMicrochip,
    refetchCert,
  };

  return <CertContext.Provider value={value}>{children}</CertContext.Provider>;
};

export function useCertContext() {
  return useContext(CertContext);
}
