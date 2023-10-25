import React from "react";
import Layout from "../../../../components/Layouts";
import OrderListTable from "../../../../components/Store/Table/OrderListTable";
import { useBitkubNext } from "../../../../contexts/bitkubNextContext";

const Orders = () => {
  const customer = JSON.parse(localStorage.getItem("customer")!);
  const { isConnected } = useBitkubNext();

  return (
    <Layout>
      {!isConnected ? (
        <div>Unauthorized</div>
      ) : (
        <div className="flex justify-center">
          <OrderListTable orders={customer.orders} />
        </div>
      )}
    </Layout>
  );
};

export default Orders;
