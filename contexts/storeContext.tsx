import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import _ from "lodash";

import {
  useRegions,
  useCreateLineItem,
  useUpdateLineItem,
  useDeleteLineItem,
  useShippingOptions,
  useAddShippingMethodToCart,
  useCreatePaymentSession,
  useSetPaymentSession,
  useCompleteCart,
  useGetCart,
  useCreateCart,
  useUpdateCart,
} from "medusa-react";
import { AddressPayload, Cart, Region } from "@medusajs/medusa";
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";
import { useBitkubNext } from "./bitkubNextContext";

//** store session in localstorage */
interface StoreProviderProps {
  children: ReactNode;
}

type StoreContextTypes = {
  currentRegion: Region | undefined;
  currentCart: Omit<Cart, "refundable_amount" | "refunded_total"> | undefined;
  isLoading: boolean;
  currentProduct: PricedProduct | undefined;
  setCurrentProduct: Dispatch<SetStateAction<PricedProduct | undefined>>;
  addToCart: (variantId: string, qty: number) => void;
  removeFromCart: (variantId: string) => void;
  incQty: (variantId: string, qty: number) => void;
  decQty: (variantId: string, qty: number) => void;
  updateShippingAddress: (address: AddressPayload) => void;
  createPaymentSession: (variants: void, options?: any) => void;
  complete: () => void;
  clearCart: () => void;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
};

const defaultStoreContextType: StoreContextTypes = {
  currentRegion: undefined,
  currentCart: undefined,
  currentProduct: undefined,
  isLoading: false,
  setCurrentProduct: () => ({}),
  addToCart: () => ({}),
  removeFromCart: () => ({}),
  incQty: () => ({}),
  decQty: () => ({}),
  updateShippingAddress: () => ({}),
  createPaymentSession: () => ({}),
  complete: () => ({}),
  clearCart: () => ({}),
  setIsLoading: () => ({}),
};

const StoreContext = createContext<StoreContextTypes>(defaultStoreContextType);

const StoreProvider = ({ children }: StoreProviderProps) => {
  const [currentProduct, setCurrentProduct] = useState<PricedProduct>();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { regions, isSuccess: gotRegion } = useRegions();

  const [currentCartId, _setCurrentCartId] = useState<string>();

  const _newCart = useCreateCart();
  const { cart: realCart, isSuccess: gotCart } = useGetCart(
    localStorage.getItem("cart_id")!
  );
  const { mutate: updateCart } = useUpdateCart(currentCartId!);
  const { mutate: createLineItem } = useCreateLineItem(currentCartId!);
  const { mutate: updateLineItem } = useUpdateLineItem(currentCartId!);
  const { mutate: deleteLineItem } = useDeleteLineItem(currentCartId!);
  const { mutate: addShippingMethod } = useAddShippingMethodToCart(
    currentCartId!
  );

  const { mutate: _createPaymentSession } = useCreatePaymentSession(
    currentCartId!
  );
  const { mutate: _setPaymentSession } = useSetPaymentSession(currentCartId!);

  const { mutate: _completeCart, isSuccess: cartCompleted } = useCompleteCart(
    currentCartId!
  );

  const [currentCart, setCurrentCart] =
    useState<Omit<Cart, "refundable_amount" | "refunded_total">>();
  const [currentRegion, _setCurrentRegion] = useState<Region>();

  const { shipping_options } = useShippingOptions({
    region_id: currentRegion?.id,
  });

  useEffect(() => {
    if (gotRegion) {
      _setCurrentRegion(regions![0]);
      if (localStorage.getItem("cart_id") == undefined) {
        _createCart();
      } else {
        if (gotCart) {
          _getCurrentCart();
        }
      }
    }
  }, [gotRegion, gotCart]);

  const _getCurrentCart = () => {
    _setCurrentCartId(realCart?.id);
    setCurrentCart(realCart!);
  };

  const _createCart = () => {
    if (localStorage.getItem("cart_id") == undefined) {
      _newCart.mutate(
        {
          region_id: regions?.length ? regions[0].id : undefined,
        },
        {
          onSuccess: ({ cart }) => {
            localStorage.setItem("cart_id", cart.id);
            setCurrentCart(cart);
            _setCurrentCartId(cart.id);
          },
        }
      );
    } else {
      _setCurrentCartId(localStorage.getItem("cart_id")!);
    }
  };

  const addToCart = (variantId: string, qty: number) => {
    if (!currentCartId) {
      _createCart();
    }

    createLineItem(
      {
        variant_id: variantId,
        quantity: qty,
      },
      {
        onSuccess: ({ cart }) => {
          setCurrentCart(cart);
        },
      }
    );
  };

  const removeFromCart = (itemId: string) => {
    deleteLineItem(
      {
        lineId: itemId,
      },
      {
        onSuccess: ({ cart }) => {
          setCurrentCart(cart);
        },
      }
    );
  };

  const incQty = (itemId: string, qty: number = 1) => {
    const prevQty = currentCart?.items.find((item) => item.id === itemId)
      ?.quantity as number | 0;

    updateLineItem(
      {
        lineId: itemId,
        quantity: prevQty + qty,
      },
      {
        onSuccess: ({ cart }) => {
          setCurrentCart(cart);
        },
      }
    );
  };

  const decQty = (itemId: string, qty: number = 1) => {
    const prevQty = currentCart?.items.find((item) => item.id === itemId)
      ?.quantity as number | 0;

    updateLineItem(
      {
        lineId: itemId,
        quantity: prevQty - qty,
      },
      {
        onSuccess: ({ cart }) => {
          setCurrentCart(cart);
        },
      }
    );
  };

  const updateShippingAddress = (address: AddressPayload) => {
    updateCart(
      {
        email: localStorage.getItem("bkc_email")!,
        shipping_address: {
          ...address,
        },
      },
      {
        onSuccess: ({ cart }) => {
          setCurrentCart(cart);
          addShippingMethod(
            {
              option_id: shipping_options![0].id!,
            },
            {
              onSuccess: ({ cart }) => {
                setCurrentCart(cart);
                createPaymentSession();
              },
            }
          );
        },
      }
    );
  };

  const createPaymentSession = () => {
    _createPaymentSession(undefined, {
      onSuccess: ({ cart }) => {
        setCurrentCart(cart);
        setPaymentSession();
      },
    });
  };

  const setPaymentSession = () => {
    _setPaymentSession(
      {
        provider_id: "stripe",
      },
      {
        onSuccess: ({ cart }) => {
          setCurrentCart({
            ...cart,
          });
        },
      }
    );
  };

  const complete = () => {
    _completeCart(undefined, {
      onSuccess: (response) => {
        clearCart();
      },
    });
  };

  const clearCart = () => {
    localStorage.removeItem("cart_id");
    setCurrentCart(undefined);
  };

  return (
    <StoreContext.Provider
      value={{
        isLoading,
        currentRegion,
        currentCart,
        currentProduct,
        setCurrentProduct,
        addToCart,
        removeFromCart,
        incQty,
        decQty,
        updateShippingAddress,
        clearCart,
        createPaymentSession,
        complete,
        setIsLoading,
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
