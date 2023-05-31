import { FunctionComponent, PropsWithChildren } from "react";
import { useRouter } from "next/router";

import axios from "axios";
import useSwr from "swr";
import { useBitkubNext } from "../../../../../hooks/bitkubNextContext";
import { useMenu } from "../../../../../hooks/menuContext";

import CertFooter from "../../../../../components/sections/cert/CertFooter";
import MenuModal from "../../../../../components/MenuModal";
import PleaseConnectWallet from "../../../../../components/sections/cert/PleaseConnect";
import Header from "../../../../../components/Header";
import BuffaloDetail from "../../../../../components/sections/myfarm/BuffaloDetail";
import BuffaloManagement from "../../../../../components/sections/myfarm/BuffaloManagement";

const get = (url: string) => axios.get(url).then((response) => response.data);

const MyFarmBuffalo: FunctionComponent<PropsWithChildren> = () => {
  const { isConnected, walletAddress } = useBitkubNext();
  const { isOpen } = useMenu();
  const { query } = useRouter();
  const { data, error, isLoading, mutate } = useSwr(
    `/api/buffalo/microchip/${query.farmId}/${query.microchip}`,
    get
  );

  return (
    <>
      <Header />
      <div
        className={`w-full bg-thuiyellow h-screen p-3 flex flex-col  justify-center items-center
tabletS:p-[30px]
tabletS:h-screen
tabletM:h-full
tabletM:p-[60px]

`}
      >
        {!isConnected ? (
          <PleaseConnectWallet />
        ) : (
          <>
            {data != undefined ? (
              <>
                <BuffaloDetail certNft={data} />
                <BuffaloManagement buffalo={data} update={mutate} />
              </>
            ) : (
              <div>not found</div>
            )}
          </>
        )}
      </div>
      {isOpen ? <MenuModal /> : null}
      <CertFooter />
    </>
  );
};

export default MyFarmBuffalo;
