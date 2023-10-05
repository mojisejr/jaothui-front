import { SyntheticEvent } from "react";
import { Product } from "../../../interfaces/Store/Product";
import { useStore } from "../../../contexts/storeContext";

interface AddToCartButtonProps {
  product: Product;
  qty: number;
}

const AddToCartButton = ({ product, qty = 1 }: AddToCartButtonProps) => {
  const { addToCart } = useStore();
  return (
    <button
      className="btn"
      onClick={() => {
        addToCart({ ...product, qty });
      }}
    >
      Add To Cart
    </button>
  );
};

export default AddToCartButton;
