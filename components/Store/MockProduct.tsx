import { Product } from "../../interfaces/Store/Product";

interface ProductCartProps {
  product: Product;
  canAddToCart: boolean;
}

const MockProductCard = ({
  product,
  canAddToCart = false,
}: ProductCartProps) => {
  return (
    <>
      <div className="w-full max-w-[250px] rounded-xl shadow-xl">
        <div className="p-4">
          <img
            className="w-full rounded-xl"
            src={product.images[0]!}
            alt="image"
          />
          <div className="grid grids-col-1 w-full rounded-xl shadow p-3">
            <div className="font-bold text-xl">{product.name}</div>
            {product.attributes.map((product, index) => (
              <ProductAttribute
                key={index}
                title={product.title}
                value={product.value}
              />
            ))}
            ---
            {/* <PriceTag actual={product.price} discount={product.discount} /> */}
            {canAddToCart ? (
              // <AddToCartButton variantId={product.variants[0].id!} qty={1} />:
              <div></div>
            ) : null}
            <div className="text-center opacity-30">Comming Soon...</div>
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
        <div className="flex gap-2 items-center flex-wrap">
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
        <div className="">
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

export default MockProductCard;
