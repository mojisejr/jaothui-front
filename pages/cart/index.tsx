import Layout from "../../components/Layouts";
import { useStore } from "../../contexts/storeContext";
import { BsCartX } from "react-icons/bs";
import CheckoutCard from "../../components/Cart/Card/CheckoutCard";
import CartContainer from "../../components/Cart/Layout/CartContainer";
import ItemCard from "../../components/Cart/Card/ItemCard";

const Cart = () => {
  const { itemInCart } = useStore();

  return (
    <>
      <Layout>
        <div className="bg-error text-thuiwhite py-2 px-1">
          TESTMODE: no actual purchasing
        </div>
        <CartContainer>
          {itemInCart.length <= 0 ? (
            <div className="flex items-center justify-start py-6 flex-col gap-2">
              <BsCartX className="opacity-60" size={150} />
              <div className="text-2xl font-bold ">Your cart is empty.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {itemInCart.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
              <CheckoutCard />
            </div>
          )}
        </CartContainer>
      </Layout>
    </>
  );
};

export default Cart;
