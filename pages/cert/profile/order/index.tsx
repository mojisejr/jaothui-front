import React from "react";
import Layout from "../../../../components/Layouts";
import OrderListTable from "../../../../components/Store/Table/OrderListTable";
import { useBitkubNext } from "../../../../contexts/bitkubNextContext";
import { useRouter } from "next/router";
import { trpc } from "../../../../utils/trpc";
import Loading from "../../../../components/Shared/Indicators/Loading";

const Orders = () => {
  const { replace } = useRouter();
  const { isConnected, walletAddress } = useBitkubNext();

  const { data, isLoading, isSuccess, isError, refetch } =
    trpc.store.getOrder.useQuery({
      wallet: walletAddress,
    });

  if (!isConnected) {
    replace("/unauthorized");
    return;
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="flex justify-center">
          {isLoading ? (
            <Loading size="lg" />
          ) : (
            <OrderListTable orders={data!} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
