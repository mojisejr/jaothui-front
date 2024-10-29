import { useRouter } from "next/router";

import { useBitkubNext } from "../../../../../contexts/bitkubNextContext";

import BuffaloDetail from "../../../../../components/MyFarm/BuffaloDetail";
import BuffaloManagement from "../../../../../components/MyFarm/BuffaloManagement";
import LoadingScreen from "../../../../../components/Shared/LoadingScreen";
import { trpc } from "../../../../../utils/trpc";
import Layout from "../../../../../components/Layouts";
import Loading from "../../../../../components/Shared/Indicators/Loading";
import BitkubNextConnectButton from "../../../../../components/Shared/BitkubNext";

const MyFarmBuffalo = () => {
  const { isConnected } = useBitkubNext();
  const { query, replace } = useRouter();

  const { data, isLoading, refetch } = trpc.buffalo.getByMicrochip.useQuery({
    farmId: +query.farmId!,
    microchip: query.microchip as string,
  });

  if (!isConnected) {
    replace("/unauthorized");
    return;
  }

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
