import React, { useEffect } from "react";
import { trpc } from "../../../utils/trpc";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import { useStore } from "../../../contexts/storeContext";
import { useRouter } from "next/router";

const Checkout = () => {
  const { replace } = useRouter();
  const { walletAddress, isConnected } = useBitkubNext();
  const { itemInCart } = useStore();
  const {
    data: checkoutData,
    mutate: checkout,
    isLoading,
    isSuccess,
  } = trpc.store.checkout.useMutation();

  useEffect(() => {
    if (isSuccess) {
      if (checkoutData.url != null) replace(checkoutData.url);
    }
  }, [isSuccess]);

  const handleCheckout = () => {
    checkout({
      wallet: walletAddress,
      items: itemInCart,
      basePath: window.location.origin,
    });
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={
          itemInCart.length <= 0 || isLoading || !isConnected || !walletAddress
        }
        className="btn btn-primary"
      >
        {isLoading ? "Processing.." : "Checkout"}
      </button>
    </div>
  );
};

export default Checkout;
