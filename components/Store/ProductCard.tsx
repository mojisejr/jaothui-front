import AddToCartButton from "../Cart/Buttons/AddToCart";
import { Product } from "../../interfaces/Store/Product";

interface ProductCartProps {
  product: Product;
  canAddToCart: boolean;
}

const ProductCard = ({ product, canAddToCart = false }: ProductCartProps) => {
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
            {canAddToCart ? (
              <AddToCartButton product={product} qty={1} />
            ) : null}
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
  discount: number | null;
}) => {
  return (
    <>
      {discount != null ? (
        <div className="font-bold flex gap-2 items-center">
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
