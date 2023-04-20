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
};

const certContextDefaultValue: CertContextType = {
  certNFTs: [],
  getNFTMicrochip: () => ({}),
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
    }
    setNft(infos!);
  }, [isConnected, address]);

  const getNFTMicrochip = (microchip: string) => {
    const found = infos!.find((m: CertNFTRawData) => m.microchip == microchip);
    return found ? found : {};
  };

  const value = {
    certNFTs,
    getNFTMicrochip,
  };

  return <CertContext.Provider value={value}>{children}</CertContext.Provider>;
};

export function useCertContext() {
  return useContext(CertContext);
}
