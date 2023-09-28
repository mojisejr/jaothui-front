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

//1. add selected items in to the cart (add)
//2. fetch the itmes there are in the cart (view)
//3. add more or remove selected items in the cart (edit/delete)

//** store session in localstorage */
interface StoreProviderProps {
  children: ReactNode;
}

type StoreContextTypes = {
  itemInCart: ItemInCart[];
  itemInCartCount: number;
  setItemInCart: Dispatch<SetStateAction<ItemInCart[]>>;
  addToCart: (item: ItemInCart) => void;
};

const defaultStoreContextType: StoreContextTypes = {
  itemInCart: [],
  itemInCartCount: 0,
  setItemInCart: () => ({}),
  addToCart: () => ({}),
};

const StoreContext = createContext<StoreContextTypes>(defaultStoreContextType);

const StoreProvider = ({ children }: StoreProviderProps) => {
  const [itemInCart, setItemInCart] = useState<ItemInCart[]>([]);
  const [itemInCartCount, setItemInCartCount] = useState<number>(0);

  useEffect(() => {}, [itemInCart]);

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

  return (
    <StoreContext.Provider
      value={{
        itemInCart,
        itemInCartCount,
        setItemInCart,
        addToCart,
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
