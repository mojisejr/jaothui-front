import { Order } from "@medusajs/medusa";
import React from "react";

interface OrderListTableProps {
  orders: Order[];
}

const OrderListTable = ({ orders }: OrderListTableProps) => {
  return (
    <div className="overflow-x-auto min-h-fit my-2 max-w-xl">
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
              <tr key={order.id}>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>{order.id.slice(0, 15)}...</td>
                <td>
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.id}>{item.title}</li>
                    ))}
                  </ul>
                </td>
                <td>{order.payment_status}</td>
                <td>{order.fulfillment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderListTable;
