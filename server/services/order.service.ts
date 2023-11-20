import { client } from "../../sanity/lib/client";
import { groq } from "next-sanity";
import { CreateOrder, Order } from "../../interfaces/Store/Order";
import { Stripe } from "stripe";

export const createOrder = async (session: Stripe.Checkout.Session) => {
  try {
    const found = await getOrderByPaymentIntent(
      session.payment_intent as string
    );
    const order = formatOrder(session);
    if (found.length > 0) {
      client.patch(found[0]._id, {
        set: {
          order,
        },
      });
      return order;
    }
    const created = await client
      .create({
        _type: "orders",
        ...order,
      })
      .catch((error) => console.log("createing error", error));

    return created;
  } catch (error) {
    console.log(error);
  }
};

export const getOrderByPaymentIntent = async (stripeIntentId: string) => {
  const query = groq`*[_type == "orders" &&  stripeIntentId == "${stripeIntentId}"]`;
  const order = await client.fetch<Order[]>(query);
  return order;
};

export const getOrdersByWallet = async (wallet: string) => {
  const query = groq`*[_type == "orders" && wallet == "${wallet}"]`;
  const orders = await client.fetch<Order[]>(query);
  return orders;
};

export const formatOrder = (session: Stripe.Checkout.Session) => {
  return {
    wallet: session.metadata?.wallet,
    email: session.customer_details?.email,
    stripeIntentId: session.payment_intent,
    products: JSON.parse(session.metadata?.items!).map((item: any) => {
      return {
        _key: `${session.payment_intent}_${item.quantity}_${item.price_data.name}`,
        product: item.price_data.product_data.name,
        amount: item.quantity,
        subtotal: (item.price_data.unit_amount * item.quantity) / 100,
      };
    }),
    shippingAddress: {
      name: session.shipping_details?.name,
      address1: session.shipping_details?.address?.line1,
      tambon: session.shipping_details?.address?.line2,
      amphoe: session.shipping_details?.address?.city,
      province: session.shipping_details?.address?.state,
      postcode: +session.shipping_details?.address?.postal_code!,
      phone: session.customer_details?.phone,
    },
    paymentStatus: session.payment_status,
    shippingStatus: "pending",
    orderStatus: "processing",
  } as CreateOrder;
};
