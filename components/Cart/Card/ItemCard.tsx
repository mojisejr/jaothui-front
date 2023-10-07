import { LineItem } from "@medusajs/medusa";
import { useStore } from "../../../contexts/storeContext";

const ItemCard = ({ item }: { item: LineItem }) => {
  const { decQty, incQty, removeFromCart } = useStore();
  return (
    <>
      <div className="relative grid grid-cols-3 shadow px-1 py-2 rounded-xl place-items-center">
        <button
          className="absolute -top-3 -right-3 btn btn-circle btn-sm btn-error"
          onClick={() => removeFromCart(item.id as string)}
        >
          x
        </button>
        <img src={item.thumbnail!} width={80} height={80} alt="product-image" />
        <div className="col-span-2">
          <ul>
            <li>
              <span className="font-bold">Name:</span> {item.title}
            </li>
            <li>
              <span className="font-bold">Qty:</span> {item.quantity}
            </li>
            <li className="text-error">
              <span className="font-bold text-thuidark">Price:</span>{" "}
              {new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: "thb",
              }).format(item.unit_price / 100)}
            </li>
            <li className="flex gap-5 items-center justify-center">
              <button
                className="btn btn-primary btn-circle text-2xl text-thuiwhite"
                onClick={() => incQty(item.id as string, 1)}
              >
                +
              </button>
              <div className="text-dark font-bold text-2xl">
                {item.quantity}
              </div>
              <button
                disabled={item.quantity == 1}
                className="btn btn-primary btn-circle text-2xl text-thuiwhite"
                onClick={() => decQty(item.id as string, 1)}
              >
                -
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default ItemCard;
