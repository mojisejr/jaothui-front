import React from "react";
import { useStore } from "../../../contexts/storeContext";

const ProductDetailModal = () => {
  const { currentProduct: product, addToCart } = useStore();
  return (
    <dialog id="product_detail" className="modal">
      <div className="modal-box">
        <div className="grid grid-cols-1 gap-2 tabletS:grid-cols-2 place-items-center">
          <img
            className="w-full"
            src={product?.images[0] as string}
            alt={product?.name}
          />
          <div>
            <h3 className="font-bold text-lg">{product?.name}</h3>
            {/* <h2 className="text-secondary text-opacity-60">
              {product?.subtitle}
            </h2> */}
            <div className="divider"></div>
            <PriceTag actual={product?.price as number} discount={null} />
            <p className="h-[120px] overflow-y-auto w-full p-2">
              {'"'}
              {product?.description}
              {'"'}
            </p>
            <button
              className="btn w-full mt-2"
              onClick={() => addToCart({ ...product!, qty: 1 })}
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

const PriceTag = ({
  actual,
  discount,
}: {
  actual: number;
  discount: number | null;
}) => {
  return (
    <>
      {discount != null ? (
        <div className="font-bold flex gap-2 items-center flex-wrap">
          <span className="line-through text-sm">
            {new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
            }).format(actual)}
          </span>
          {new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(discount)}
        </div>
      ) : (
        <div className="font-bold">
          {new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(actual)}
        </div>
      )}
    </>
  );
};

export default ProductDetailModal;
