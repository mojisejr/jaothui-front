import { FunctionComponent, PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/router";

import { useBitkubNext } from "../../../../../contexts/bitkubNextContext";
import { useMenu } from "../../../../../contexts/menuContext";

import CertFooter from "../../../../../components/sections/cert/CertFooter";
import MenuModal from "../../../../../components/MenuModal";
import PleaseConnectWallet from "../../../../../components/sections/cert/PleaseConnect";
import Header from "../../../../../components/Header";
import BuffaloDetail from "../../../../../components/sections/myfarm/BuffaloDetail";
import BuffaloManagement from "../../../../../components/sections/myfarm/BuffaloManagement";
import LoadingScreen from "../../../../../components/LoadingScreen";
import { trpc } from "../../../../../utils/trpc";

const MyFarmBuffalo: FunctionComponent<PropsWithChildren> = () => {
  const { isConnected } = useBitkubNext();
  const { isOpen } = useMenu();
  const { query } = useRouter();

  const { data, isLoading, refetch } = trpc.buffalo.getByMicrochip.useQuery({
    farmId: +query.farmId!,
    microchip: query.microchip as string,
  });

  return (
    <>
      <Header />
      <div
        className={`w-full bg-thuiyellow h-screen p-3 flex flex-col  justify-center items-center
        min-h-[60vh]
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
                <BuffaloManagement buffalo={data} update={refetch} />
              </>
            ) : (
              <>
                {isLoading ? (
                  <div className="text-3xl">Loading..</div>
                ) : (
                  <div className="text-3xl">Not Found</div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <CertFooter />
      {isOpen ? <MenuModal /> : null}
      {isLoading ? <LoadingScreen /> : null}
    </>
  );
};

export default MyFarmBuffalo;
