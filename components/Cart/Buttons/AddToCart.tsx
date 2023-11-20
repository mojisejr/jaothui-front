import { useStore } from "../../../contexts/storeContext";
import { ItemInCart } from "../../../interfaces/Store/ItemInCart";

interface AddToCartButtonProps {
  item: ItemInCart;
}

const AddToCartButton = ({ item }: AddToCartButtonProps) => {
  const { addToCart } = useStore();
  return (
    <button
      className="btn"
      onClick={() => {
        addToCart(item);
      }}
    >
      Add To Cart
    </button>
  );
};

export default AddToCartButton;
