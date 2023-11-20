import { Order } from "../../../interfaces/Store/Order";
import React from "react";

interface OrderListTableProps {
  orders: Order[];
}

const OrderListTable = ({ orders }: OrderListTableProps) => {
  return (
    <div className="overflow-auto h-full  max-h-[500px] my-2 max-w-xl">
      <h3 className="font-bold text-2xl">Your Orders</h3>
      {orders.length <= 0 ? (
        <div>No Order</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Id</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Shipping</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  {new Date(order._createdAt as string).toLocaleDateString()}
                </td>
                <td>{order.stripeIntentId.slice(0, 15)}...</td>
                <td>
                  <ul>
                    {order.products?.map((item) => (
                      <li key={item._key}>{item.product}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <div
                    className={`badge badge-sm ${
                      order.paymentStatus == "pending"
                        ? "badge-primary"
                        : "badge-success"
                    }`}
                  >
                    {order.paymentStatus}
                  </div>
                </td>
                <td>
                  <div
                    className={`badge badge-sm ${
                      order.shippingStatus == "pending"
                        ? "badge-primary"
                        : "badge-success"
                    }`}
                  >
                    {order.shippingStatus}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderListTable;
