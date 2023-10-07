import Layout from "../../components/Layouts";
import { useStore } from "../../contexts/storeContext";
import { BsCartX } from "react-icons/bs";
import CartContainer from "../../components/Cart/Layout/CartContainer";
import ItemCard from "../../components/Cart/Card/ItemCard";
import Shipping from "../../components/Cart/Card/Shipping";

const Cart = () => {
  const { currentCart } = useStore();

  return (
    <>
      <Layout>
        {/* <div className="bg-error text-thuiwhite py-2 px-1">
          TESTMODE: no actual purchasing
        </div> */}
        <CartContainer>
          {currentCart == undefined || currentCart?.items.length! <= 0 ? (
            <div className="flex items-center justify-start py-6 flex-col gap-2 min-h-screen">
              <BsCartX className="opacity-60" size={150} />
              <div className="text-2xl font-bold ">Your cart is empty.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-w-[1440px] tabletS:grid-cols-2 tabletM:gap-[3rem]">
              <div>
                <div className="divider">Cart</div>
                {currentCart?.items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
              <div>
                <div className="divider">Shipping & Checkout</div>
                <Shipping />
              </div>
            </div>
          )}
        </CartContainer>
      </Layout>
    </>
  );
};

export default Cart;
