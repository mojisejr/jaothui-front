import React from "react";
import { useStore } from "../../../contexts/storeContext";
import { formatVariantPrice } from "medusa-react";

const ProductDetailModal = () => {
  const { currentProduct: product, currentRegion, addToCart } = useStore();
  return (
    <dialog id="product_detail" className="modal">
      <div className="modal-box">
        <div className="grid grid-cols-1 gap-2 tabletS:grid-cols-2 place-items-center">
          <img
            className="w-full"
            src={product?.thumbnail as string}
            alt={product?.title}
          />
          <div>
            <h3 className="font-bold text-lg">{product?.title}</h3>
            <h2 className="text-secondary text-opacity-60">
              {product?.subtitle}
            </h2>
            <div className="divider"></div>
            <div className="text-2xl font-bold text-primary">
              {
                <ul>
                  {product?.variants.map((variant) => (
                    <li key={variant.id}>
                      {formatVariantPrice({
                        variant,
                        region: {
                          currency_code: currentRegion?.currency_code as string,
                          tax_code: currentRegion?.tax_code as string,
                          tax_rate: currentRegion?.tax_rate as number,
                        },
                      })}
                    </li>
                  ))}
                </ul>
              }
            </div>
            <p className="h-[120px] overflow-y-auto w-full p-2">
              {'"'}
              discontinuing support for existing virtual BAT balances.
              Unfortunately, there are no available custodians in your region
              (TH) to withdraw your earnings. Until then, you can still
              contribute to your favorite crea
              {/* {product?.description} */}
              {'"'}
            </p>
            <button
              className="btn w-full mt-2"
              onClick={() => addToCart(product?.variants[0].id!, 1)}
            >
              Add To Cart
            </button>
          </div>
        </div>
        <div className="modal-action">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-primary absolute right-2 top-2">
              ✕
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default ProductDetailModal;
