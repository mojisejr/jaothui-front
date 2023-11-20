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
import { Product } from "../interfaces/Store/Product";
import { Region } from "@medusajs/medusa";
import { useBitkubNext } from "./bitkubNextContext";

//** store session in localstorage */
interface StoreProviderProps {
  children: ReactNode;
}

type StoreContextTypes = {
  itemInCart: ItemInCart[];
  itemInCartCount: number;
  totalPrice: number;
  currentProduct: Product | undefined;
  setItemInCart: Dispatch<SetStateAction<ItemInCart[]>>;
  setCurrentProduct: Dispatch<SetStateAction<Product | undefined>>;
  addToCart: (item: ItemInCart) => void;
  removeFromCart: (item: ItemInCart) => void;
  incQty: (item: Product, qty: number) => void;
  decQty: (item: Product, qty: number) => void;
  clearCart: () => void;
};

const defaultStoreContextType: StoreContextTypes = {
  itemInCart: [],
  totalPrice: 0,
  itemInCartCount: 0,
  currentProduct: undefined,
  setItemInCart: () => ({}),
  setCurrentProduct: () => ({}),
  addToCart: () => ({}),
  removeFromCart: () => ({}),
  incQty: () => ({}),
  decQty: () => ({}),
  clearCart: () => ({}),
};

const StoreContext = createContext<StoreContextTypes>(defaultStoreContextType);

const StoreProvider = ({ children }: StoreProviderProps) => {
  const [itemInCart, setItemInCart] = useState<ItemInCart[]>([]);
  const [itemInCartCount, setItemInCartCount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [currentProduct, setCurrentProduct] = useState<Product>();

  const addToCart = (item: ItemInCart) => {
    let alreadyInCart = itemInCart.find((inCart) => inCart._id === item._id);

    setTotalPrice((prev) => {
      if (item.discount) {
        return prev + item.qty * item.discount;
      } else {
        return prev + item.qty * item.price;
      }
    });

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
    console.log("removing");
    let alreadyInCart = itemInCart.find((inCart) => inCart._id === item._id);

    setTotalPrice((prev) => {
      if (item.discount) {
        return prev - item.qty * item.discount;
      } else {
        return prev - item.qty * item.price;
      }
    });

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

    setTotalPrice((prev) => {
      if (item.discount) {
        return prev + qty * item.discount;
      } else {
        return prev + qty * item.price;
      }
    });

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

    setTotalPrice((prev) => {
      if (item.discount) {
        return prev - qty * item.discount;
      } else {
        return prev - qty * item.price;
      }
    });

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

  const clearCart = () => {
    setItemInCart([]);
    setItemInCartCount(0);
    setTotalPrice(0);
  };

  return (
    <StoreContext.Provider
      value={{
        itemInCart,
        itemInCartCount,
        totalPrice,
        currentProduct,
        setItemInCart,
        setCurrentProduct,
        addToCart,
        removeFromCart,
        incQty,
        decQty,
        clearCart,
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
