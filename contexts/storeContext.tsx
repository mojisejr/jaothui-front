import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { ItemInCart } from "../interfaces/Store/ItemInCart";
import _ from "lodash";
import { toast } from "react-toastify";
import { Product } from "../interfaces/Store/Product";

//1. add selected items in to the cart (add)
//2. fetch the itmes there are in the cart (view)
//3. add more or remove selected items in the cart (edit/delete)

//to add and remove item in array and stil got same previous position
//1. check index of before changes if 0 just edit
//2. filter out the old one
//3. split array at the index - 1
//4. concat head and tail with the middle(updated one)

//** store session in localstorage */
interface StoreProviderProps {
  children: ReactNode;
}

type StoreContextTypes = {
  itemInCart: ItemInCart[];
  itemInCartCount: number;
  setItemInCart: Dispatch<SetStateAction<ItemInCart[]>>;
  addToCart: (item: ItemInCart) => void;
  removeFromCart: (item: ItemInCart) => void;
  incQty: (item: Product, qty: number) => void;
  decQty: (item: Product, qty: number) => void;
};

const defaultStoreContextType: StoreContextTypes = {
  itemInCart: [],
  itemInCartCount: 0,
  setItemInCart: () => ({}),
  addToCart: () => ({}),
  removeFromCart: () => ({}),
  incQty: () => ({}),
  decQty: () => ({}),
};

const StoreContext = createContext<StoreContextTypes>(defaultStoreContextType);

const StoreProvider = ({ children }: StoreProviderProps) => {
  const [itemInCart, setItemInCart] = useState<ItemInCart[]>([]);
  const [itemInCartCount, setItemInCartCount] = useState<number>(0);

  const addToCart = (item: ItemInCart) => {
    let alreadyInCart = itemInCart.find((inCart) => inCart._id === item._id);
    if (alreadyInCart) {
      _.remove(itemInCart, alreadyInCart);
      const updatedItemInCart = _.concat(itemInCart, {
        ...alreadyInCart,
        qty: alreadyInCart?.qty + item.qty,
      });
      setItemInCart(updatedItemInCart);
      setItemInCartCount((prev) => prev + item.qty);
    } else {
      setItemInCart([...itemInCart, { ...item }]);
      setItemInCartCount((prev) => prev + item.qty);
    }
  };

  const removeFromCart = (item: ItemInCart) => {
    let alreadyInCart = itemInCart.find((inCart) => inCart._id === item._id);
    if (alreadyInCart) {
      _.remove(itemInCart, alreadyInCart);
      const itemLeft = itemInCart.filter(
        (inCart) => inCart._id !== alreadyInCart?._id
      );
      setItemInCart(itemLeft.length <= 0 ? [] : itemLeft);
      setItemInCartCount((prev) => (prev <= 0 ? 0 : prev - item.qty));
    }
  };

  const incQty = (item: Product, qty: number = 1) => {
    let alreadyInCart = itemInCart.find((inCart) => inCart._id === item._id);
    const index = _.indexOf(itemInCart, alreadyInCart);
    // itemInCart[index] = ;

    if (alreadyInCart) {
      setItemInCart((prev) => {
        prev[index] = {
          ...alreadyInCart,
          qty: alreadyInCart?.qty === undefined ? 0 : alreadyInCart.qty + qty,
        } as ItemInCart;
        return prev;
      });
      setItemInCartCount((prev) => (prev <= 0 ? 0 : prev + qty));
    }
  };

  const decQty = (item: Product, qty: number = 1) => {
    let alreadyInCart = itemInCart.find((inCart) => inCart._id === item._id);
    const index = _.indexOf(itemInCart, alreadyInCart);

    if (alreadyInCart && alreadyInCart.qty > 1) {
      setItemInCart((prev) => {
        prev[index] = {
          ...alreadyInCart,
          qty: alreadyInCart?.qty === undefined ? 0 : alreadyInCart.qty - qty,
        } as ItemInCart;
        return prev;
      });
      setItemInCartCount((prev) => (prev <= 0 ? 0 : prev - qty));
    }
  };

  return (
    <StoreContext.Provider
      value={{
        itemInCart,
        itemInCartCount,
        setItemInCart,
        addToCart,
        removeFromCart,
        incQty,
        decQty,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  return useContext(StoreContext);
};

export default StoreProvider;
