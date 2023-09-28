import Link from "next/link";
import Loading from "../Shared/Indicators/Loading";
import { ReactNode } from "react";
import AddToCartButton from "../Cart/Buttons/AddToCart";
import { Product } from "../../../interfaces/Store/Product";

interface ProductCartProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCartProps) => {
  return (
    <>
      <div className="w-full max-w-[320px] rounded-xl shadow-xl">
        <div className="p-4">
          <img
            className="w-full rounded-xl"
            src={product.images[0]}
            alt="image"
          />
          <div className="grid grids-col-1 w-full rounded-xl shadow p-3">
            <div className="font-bold text-xl">{product.name}</div>
            {product.desc.length <= 0
              ? null
              : product.desc.map((attr, index) => (
                  <ProductAttribute
                    key={index}
                    title={attr.title}
                    value={attr.value}
                  />
                ))}
            <PriceTag actual={product.price} discount={product.discount} />
            <AddToCartButton product={product} qty={1} />
          </div>
        </div>
      </div>
    </>
  );
};

const PriceTag = ({
  actual,
  discount,
}: {
  actual: number;
  discount?: number;
}) => {
  return (
    <>
      {discount != undefined ? (
        <div className="font-bold">
          <span className="line-through">{`฿${actual}`}</span> ฿{discount}
        </div>
      ) : (
        <div className="font-bold">฿{actual}</div>
      )}
    </>
  );
};

const ProductAttribute = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  return (
    <>
      <div className="">{`${title.toUpperCase()}: ${value}`}</div>
    </>
  );
};

export default ProductCard;
