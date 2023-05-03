import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { IMetadata } from "../../interfaces/iMetadata";
import { useGetMetadataOf } from "../../blockchain/cert/read";
import { useAccount } from "wagmi";

type CertContextType = {
  certNFTs: IMetadata[] | [];
  getNFTMicrochip: (microhip: string) => IMetadata | {};
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
  const [certNFTs, setNft] = useState<IMetadata[] | []>([]);
  const { isConnected, address } = useAccount();
  const { metadata, metaLoading, metaRefetch } = useGetMetadataOf(address!);

  useEffect(() => {
    if (!isConnected) {
      setNft([]);
    }
    setNft(metadata!);
  }, [isConnected, address, metaLoading]);

  const getNFTMicrochip = (microchip: string) => {
    const found = metadata!.find(
      (m: IMetadata) => m.attributes![0].value == microchip
    );
    return found ? found : {};
  };

  const refetchCert = (from: string) => {
    console.log(`refetch cert from ${from}`);
    metaRefetch();
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
