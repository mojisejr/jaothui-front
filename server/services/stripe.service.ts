import { Stripe } from "stripe";
import { ItemInCart } from "../../interfaces/Store/ItemInCart";
import { TRPCError } from "@trpc/server";

const config: Stripe.StripeConfig = {
  apiVersion: "2023-08-16",
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, config);

export const stripeCheckOut = async (
  params: Stripe.Checkout.SessionCreateParams
) => {
  try {
    const session = await stripe.checkout.sessions.create(params);
    return session;
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "stripe checkout error",
    });
  }
};

export const createCheckoutParam = (
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  basePath: string
) => {
  const params: Stripe.Checkout.SessionCreateParams = {
    submit_type: "pay",
    mode: "payment",
    payment_method_types: ["card"],
    billing_address_collection: "required",
    line_items: lineItems,
    success_url: `${basePath}/payment/success`,
    cancel_url: `${basePath}/payment/cancel`,
  };
  return params;
};

export const createLineItems = (items: ItemInCart[]) => {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item: ItemInCart) => {
      return {
        price_data: {
          currency: "thb",
          product_data: {
            name: item.name,
            images: item.images,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.qty,
      };
    }
  );
  return lineItems;
};
