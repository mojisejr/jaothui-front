import {
  CardElement,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { SyntheticEvent, useEffect, useState, FormEvent } from "react";
import { useStore } from "../../../contexts/storeContext";
import Loading from "../../Shared/Indicators/Loading";
import { useRouter } from "next/router";

interface CheckoutV2FormProps {
  clientSecret: string;
}

const CheckoutV2Form = ({ clientSecret }: CheckoutV2FormProps) => {
  const { replace } = useRouter();
  const [message, setMessage] = useState<string>("");
  const stripe = useStripe();
  const elements = useElements();
  const { currentCart, complete, isLoading, setIsLoading } = useStore();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then((intent) => {
      switch (intent.paymentIntent?.status) {
        case "succeeded": {
          setMessage("Payment Succeeded!");
          break;
        }
        case "processing": {
          setMessage("Processing your payment...");
          break;
        }
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    return stripe
      ?.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements?.getElement(CardElement)!,
          billing_details: {
            name: `${currentCart?.shipping_address?.first_name} ${currentCart?.shipping_address?.last_name}`,
            phone: currentCart?.shipping_address?.phone!,
            address: {
              line1: currentCart?.shipping_address?.address_1!,
              line2: currentCart?.shipping_address?.address_2!,
              city: currentCart?.shipping_address?.province!,
              postal_code: currentCart?.shipping_address?.postal_code!,
            },
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (!error) {
          complete();
          replace("/payment/success");
        } else {
          replace("/payment/cancel");
        }
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <form className="flex flex-col justify-center gap-2" id="payment-form">
      <div className="divider">Payment</div>
      <div className="p-6">
        <CardElement />
      </div>
      <button
        className="btn btn-primary"
        disabled={isLoading || !stripe || !elements}
        id="submit"
        onClick={(e) => handleSubmit(e)}
      >
        {isLoading ? <Loading size="md" /> : "Pay now"}
      </button>
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
};

export default CheckoutV2Form;
