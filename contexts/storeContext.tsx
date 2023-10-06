import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import _ from "lodash";
import { trpc } from "../utils/trpc";

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

//** store session in localstorage */
interface StoreProviderProps {
  children: ReactNode;
}

type StoreContextTypes = {
  currentRegion: Region | undefined;
  currentCart: Omit<Cart, "refundable_amount" | "refunded_total"> | undefined;
  addToCart: (variantId: string, qty: number) => void;
  removeFromCart: (variantId: string) => void;
  incQty: (variantId: string, qty: number) => void;
  decQty: (variantId: string, qty: number) => void;
  updateShippingAddress: (address: AddressPayload) => void;
  createPaymentSession: (variants: void, options?: any) => void;
  complete: () => void;
  clearCart: () => void;
};

const defaultStoreContextType: StoreContextTypes = {
  currentRegion: undefined,
  currentCart: undefined,
  addToCart: () => ({}),
  removeFromCart: () => ({}),
  incQty: () => ({}),
  decQty: () => ({}),
  updateShippingAddress: () => ({}),
  createPaymentSession: () => ({}),
  complete: () => ({}),
  clearCart: () => ({}),
};

const StoreContext = createContext<StoreContextTypes>(defaultStoreContextType);

const StoreProvider = ({ children }: StoreProviderProps) => {
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
      return;
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
    updateCart.mutate(
      {
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
            // email: customer.email,
            // customer_id: customer.id,
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
    localStorage.removeItem(cart?.id!);
    setCurrentCart(undefined);
  };

  return (
    <StoreContext.Provider
      value={{
        currentRegion,
        currentCart,
        addToCart,
        removeFromCart,
        incQty,
        decQty,
        updateShippingAddress,
        clearCart,
        createPaymentSession,
        complete,
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
