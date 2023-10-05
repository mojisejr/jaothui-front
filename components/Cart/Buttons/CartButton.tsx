import React from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { useStore } from "../../../contexts/storeContext";

const CartButton = () => {
  const { itemInCartCount } = useStore();
  return (
    <>
      <button className="btn btn-circle btn-ghost relative">
        <AiOutlineShoppingCart size={24} />
        <div className="badge absolute top-1 right-0 badge-sm badge-primary text-thuiwite font-bold">
          {itemInCartCount}
        </div>
      </button>
    </>
  );
};

export default CartButton;
