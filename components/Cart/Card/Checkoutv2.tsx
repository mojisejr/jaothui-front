import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutV2Form from "../Form/CheckoutForm";
import { useStore } from "../../../contexts/storeContext-medusa";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY as string
);

const CheckoutV2 = () => {
  const { createPaymentSession, currentCart } = useStore();

  useEffect(() => {
    // createPaymentSession();
  }, []);

  return (
    <>
      {currentCart?.payment_session?.data.client_secret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: currentCart?.payment_session?.data
              .client_secret as string,
          }}
        >
          <CheckoutV2Form
            clientSecret={
              currentCart?.payment_session?.data.client_secret as string
            }
          />
        </Elements>
      )}
    </>
  );
};

export default CheckoutV2;
