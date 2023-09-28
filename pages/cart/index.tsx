import { ReactNode } from "react";
import Layout from "../../components/Layouts";
import { useStore } from "../../contexts/storeContext";
import { ItemInCart } from "../../interfaces/Store/ItemInCart";
import { BsCartX } from "react-icons/bs";

const Cart = () => {
  const { itemInCart } = useStore();
  return (
    <>
      <Layout>
        <CartContainer>
          {itemInCart.length <= 0 ? (
            <div className="flex items-center justify-start py-6 flex-col gap-2">
              <BsCartX className="opacity-80" size={150} />
              <div className="text-2xl font-bold">Your cart is empty.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {itemInCart.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </CartContainer>
      </Layout>
    </>
  );
};

const CartContainer = ({ children }: { children: ReactNode }) => {
  return <div className="min-h-screen px-6 py-5">{children}</div>;
};

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
        <img src={item.images[0]} width={80} height={80} alt="product-image" />
        <div className="col-span-2">
          <ul>
            <li>
              <span className="font-bold">Name:</span> {item.name}
            </li>
            <li>
              <span className="font-bold">Qty:</span> {item.qty}
            </li>
            <li className="flex gap-5 items-center justify-center">
              <button
                className="btn btn-primary btn-circle text-2xl text-thuiwhite"
                onClick={() => incQty(item, 1)}
              >
                +
              </button>
              <div className="text-dark font-bold text-2xl">{item.qty}</div>
              <button
                className="btn btn-primary btn-circle text-2xl text-thuiwhite"
                onClick={() => decQty(item, 1)}
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

export default Cart;
