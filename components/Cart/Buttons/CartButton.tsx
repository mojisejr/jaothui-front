import React from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { useStore } from "../../../contexts/storeContext";
import { useCart } from "medusa-react";

const CartButton = () => {
  const { currentCart } = useStore();
  return (
    <>
      <button className="btn btn-circle btn-ghost relative">
        <AiOutlineShoppingCart size={24} />
        <div className="badge absolute top-1 right-0 badge-sm badge-primary text-thuiwite font-bold">
          0
          {/* {currentCart?.items.length! <= 0
            ? 0
            : currentCart?.items
                .map((item) => item.quantity)
                .reduce((a, b) => a + b)} */}
        </div>
      </button>
    </>
  );
};

export default CartButton;
