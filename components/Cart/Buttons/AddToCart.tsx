import { SyntheticEvent } from "react";
import { Product } from "../../../interfaces/Store/Product";
import { useStore } from "../../../contexts/storeContext";

interface AddToCartButtonProps {
  variantId: string;
  qty: number;
}

const AddToCartButton = ({ variantId, qty = 1 }: AddToCartButtonProps) => {
  const { addToCart } = useStore();
  return (
    <button
      className="btn"
      onClick={() => {
        addToCart(variantId, qty);
      }}
    >
      Add To Cart
    </button>
  );
};

export default AddToCartButton;
