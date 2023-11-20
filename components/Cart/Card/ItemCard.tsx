import { ItemInCart } from "../../../interfaces/Store/ItemInCart";
import { useStore } from "../../../contexts/storeContext";

const ItemCard = ({ item }: { item: ItemInCart }) => {
  const { decQty, incQty, removeFromCart } = useStore();

  return (
    <>
      <div className="relative grid grid-cols-3 shadow px-1 py-2 rounded-xl place-items-center">
        <button
          className="absolute -top-3 -right-3 btn btn-circle btn-sm btn-error"
          onClick={() => removeFromCart(item)}
        >
          x
        </button>
        <img src={item.images[0]!} width={80} height={80} alt="product-image" />
        <div className="col-span-2">
          <ul>
            <li>
              <span className="font-bold">Name:</span> {item.name}
            </li>
            <li>
              <span className="font-bold">Qty:</span> {item.qty}
            </li>
            <li className="text-error">
              <span className="font-bold text-thuidark">Price:</span>{" "}
              {new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: "thb",
              }).format(item.price! * item.qty)}
            </li>
            <li className="flex gap-5 items-center justify-center">
              <button
                disabled={item.qty == 1}
                className="btn btn-primary btn-circle text-2xl text-thuiwhite"
                onClick={() => decQty(item, 1)}
              >
                -
              </button>
              <div className="text-dark font-bold text-2xl">{item.qty}</div>
              <button
                className="btn btn-primary btn-circle text-2xl text-thuiwhite"
                onClick={() => incQty(item, 1)}
              >
                +
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default ItemCard;
