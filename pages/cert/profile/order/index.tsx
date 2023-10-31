import React from "react";
import Layout from "../../../../components/Layouts";
import OrderListTable from "../../../../components/Store/Table/OrderListTable";
import { useBitkubNext } from "../../../../contexts/bitkubNextContext";
import { useRouter } from "next/router";

const Orders = () => {
  const { replace } = useRouter();
  const customer = JSON.parse(localStorage.getItem("customer")!);
  const { isConnected } = useBitkubNext();


  if(!isConnected) {
    replace("/unauthorized");
    return;
  }

  return (
    <Layout>
        <div className="flex justify-center">
          <OrderListTable orders={customer.orders} />
        </div>
    </Layout>
  );
};

export default Orders;
