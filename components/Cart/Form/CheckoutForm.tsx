import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { SyntheticEvent } from "react";
import { useStore } from "../../../contexts/storeContext";

interface CheckoutV2FormProps {
  clientSecret: string;
}

const CheckoutV2Form = ({ clientSecret }: CheckoutV2FormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { currentCart, complete } = useStore();

  const handlePayment = async (e: SyntheticEvent) => {
    e.preventDefault();
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
        console.log("Payment Error: ", error);
        console.log("Error Intent: ", paymentIntent);
        console.log(currentCart);
        if (!error) {
          complete();
        }
      });
  };

  return (
    <form>
      <CardElement />
      <button onClick={(e) => handlePayment(e)}>Submit</button>
    </form>
  );
};

export default CheckoutV2Form;
