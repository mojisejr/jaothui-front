import React, { useEffect, useState } from "react";
import Layout from "../../../../components/Layouts";
import { useRouter } from "next/router";
import HotWheel from "../../../../components/Privilege/HotWheel";
import { useBitkubNext } from "../../../../contexts/bitkubNextContext";

const HotWheelGame1 = () => {
  const { isConnected } = useBitkubNext();
  const { replace, query } = useRouter();
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    if (!isConnected) {
      void replace("/profile");
    }
  }, [isConnected]);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <Layout>
      <>
        {typeof window !== "undefined" && ready ? (
          <div className="bg-[#000000] text-thuiwhite p-2 w-full min-h-screen">
            <div className="text-center">
              <span className="text-2xl font-bold p-2">Hot Wheel</span>
            </div>
            <div>
              <HotWheel
                contractAddress={query.c as string}
                gameId={query.id as string}
              />
            </div>
          </div>
        ) : (
          <div>Loading..</div>
        )}
      </>
    </Layout>
  );
};

export default HotWheelGame1;
