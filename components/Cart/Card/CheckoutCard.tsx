import { useStore } from "../../../contexts/storeContext";
import { loadStripe } from "@stripe/stripe-js";
import { trpc } from "../../../utils/trpc";
import { useEffect } from "react";
import Loading from "../../Shared/Indicators/Loading";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY as string
);

const CheckoutCard = () => {
  const { totalPrice, itemInCartCount, itemInCart } = useStore();
  const {
    data: session,
    isLoading,
    isSuccess,
    mutate: checkout,
  } = trpc.store.checkout.useMutation();

  useEffect(() => {
    if (isSuccess && session) {
      stripePromise
        .then((stripe) => {
          stripe?.redirectToCheckout({ sessionId: session.id });
        })
        .catch((error) => {
          console.log("error on checkout", error);
        });
    }
  }, [isSuccess]);

  const handleCheckout = async () => {
    if (itemInCart.length <= 0) return;
    checkout({ items: itemInCart });
  };
  return (
    <>
      <div className="grid grid-cols-2 px-1">
        <div>
          <div>Total Price</div>
          <div className="font-bold text-xl">
            {new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
            }).format(totalPrice)}
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={handleCheckout}>
            {isLoading ? (
              <div className="flex gap-2 items-center font-bold">
                <Loading size="sm" /> Checking...
              </div>
            ) : (
              <>
                Checkout <span className="badge">{itemInCartCount}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default CheckoutCard;
