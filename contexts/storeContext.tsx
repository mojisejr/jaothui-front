import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import _, { replace } from "lodash";

import {
  useRegions,
  useCart,
  useCreateLineItem,
  useUpdateLineItem,
  useDeleteLineItem,
  useShippingOptions,
  useAddShippingMethodToCart,
  useCreatePaymentSession,
  useSetPaymentSession,
  useCompleteCart,
} from "medusa-react";
import { AddressPayload, Cart, Region } from "@medusajs/medusa";
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";

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
  const { regions, isSuccess } = useRegions();
  const { cart, createCart, updateCart } = useCart();

  const [currentCartId, _setCurrentCartId] = useState<string>();
  const _createLineItem = useCreateLineItem(currentCartId!);
  const _updateLineItem = useUpdateLineItem(currentCartId!);
  const _removeLineItem = useDeleteLineItem(currentCartId!);

  const _addShippingMethod = useAddShippingMethodToCart(currentCartId!);

  const _createPaymenySession = useCreatePaymentSession(currentCartId!);
  const _setPaymentSession = useSetPaymentSession(currentCartId!);

  const _completeCart = useCompleteCart(currentCartId!);

  const [currentCart, setCurrentCart] =
    useState<Omit<Cart, "refundable_amount" | "refunded_total">>();
  const [currentRegion, _setCurrentRegion] = useState<Region>();

  const { shipping_options } = useShippingOptions({
    region_id: currentRegion?.id,
  });

  useEffect(() => {
    if (isSuccess) {
      _setCurrentRegion(regions![0]);
      _createCart();
    }
  }, [isSuccess, cart]);

  const _createCart = () => {
    if (cart?.id != localStorage.getItem("cart_id")) {
      createCart.mutate(
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
    }
  };

  const addToCart = (variantId: string, qty: number) => {
    if (!currentCartId) {
      _createCart();
    }

    _createLineItem.mutate(
      {
        variant_id: variantId,
        quantity: qty,
      },
      {
        onSuccess: ({ cart }) => {
          cart.items;
          setCurrentCart(cart);
        },
      }
    );
  };

  const removeFromCart = (itemId: string) => {
    _removeLineItem.mutate(
      {
        lineId: itemId,
      },
      {
        onSuccess: ({ cart }) => {
          cart.items;
          setCurrentCart(cart);
        },
      }
    );
  };

  const incQty = (itemId: string, qty: number = 1) => {
    const prevQty = currentCart?.items.find((item) => item.id === itemId)
      ?.quantity as number | 0;

    _updateLineItem.mutate(
      {
        lineId: itemId,
        quantity: prevQty + qty,
      },
      {
        onSuccess: ({ cart }) => {
          cart.items;
          setCurrentCart(cart);
        },
      }
    );
  };

  const decQty = (itemId: string, qty: number = 1) => {
    const prevQty = currentCart?.items.find((item) => item.id === itemId)
      ?.quantity as number | 0;

    _updateLineItem.mutate(
      {
        lineId: itemId,
        quantity: prevQty - qty,
      },
      {
        onSuccess: ({ cart }) => {
          cart.items;
          setCurrentCart(cart);
        },
      }
    );
  };

  const updateShippingAddress = (address: AddressPayload) => {
    const customer = JSON.parse(localStorage.getItem("customer")!);

    updateCart.mutate(
      {
        customer_id: customer.id,
        email: customer.email,
        shipping_address: {
          ...address,
        },
      },
      {
        onSuccess: ({ cart }) => {
          console.log("shipping => shipping address is updated");
          setCurrentCart(cart);
          _addShippingMethod.mutate(
            {
              option_id: shipping_options![0].id!,
            },
            {
              onSuccess: ({ cart }) => {
                setCurrentCart(cart);
                console.log("shipping method => shipping method added", cart);
                createPaymentSession();
              },
            }
          );
        },
      }
    );
  };

  const createPaymentSession = () => {
    _createPaymenySession.mutate(undefined, {
      onSuccess: ({ cart }) => {
        console.log("payment => payment session is created");
        setCurrentCart(cart);
        setPaymentSession();
      },
    });
  };

  const setPaymentSession = () => {
    _setPaymentSession.mutate(
      {
        provider_id: "stripe",
      },
      {
        onSuccess: ({ cart }) => {
          console.log("payment ==> payment session is set to the cart");
          setCurrentCart({
            ...cart,
          });
        },
      }
    );
  };

  const complete = () => {
    _completeCart.mutate(undefined, {
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
