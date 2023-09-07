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
import Layout from "../../../../../components/v2/Layouts";
import Loading from "../../../../../components/v2/Shared/Indicators/Loading";
import BitkubNextConnectButton from "../../../../../components/BitkubNext";

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
      <Layout>
        <div
          className={`w-full bg-base-200 h-screen p-3 flex flex-col  justify-center items-center
        min-h-screen
`}
        >
          {!isConnected ? (
            <div>
              <div className="py-2">Please Connect Wallet</div>
              <BitkubNextConnectButton />
            </div>
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
                    <div className="text-3xl">
                      <Loading size="lg" />
                    </div>
                  ) : (
                    <div className="text-3xl">Not Found</div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </Layout>
      {isLoading ? <LoadingScreen /> : null}
    </>
  );
};

export default MyFarmBuffalo;
