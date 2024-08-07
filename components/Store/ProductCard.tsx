import AddToCartButton from "../Cart/Buttons/AddToCart";
import Loading from "../Shared/Indicators/Loading";
import { SyntheticEvent } from "react";
import { Product, ProductAttr } from "../../interfaces/Store/Product";
import { useStore } from "../../contexts/storeContext";

interface ProductCartProps {
  product: Product;
  canAddToCart: boolean;
}

const ProductCard = ({ product, canAddToCart = false }: ProductCartProps) => {
  // const { currentRegion } = useStore();
  const { setCurrentProduct } = useStore();

  const handleShowDetail = (e: SyntheticEvent) => {
    e.preventDefault();
    setCurrentProduct(product);
    window.product_detail.showModal();
  };

  if (product == null || product == undefined) {
    return <Loading size="lg" />;
  }

  return (
    <>
      <div>
        <div className="w-full max-w-[320px] rounded-xl shadow-xl">
          <div className="p-4">
            <img
              className="w-full rounded-xl"
              src={product.images[0]!}
              alt="image"
            />
            <div className="grid grids-col-1 w-full rounded-xl shadow p-3">
              <a
                onClick={(e) => handleShowDetail(e)}
                // href={`/store/${product.collection?.handle}/${product.handle}`}
                className="font-bold text-xl hover:underline hover:cursor-pointer"
              >
                {product.name}
              </a>

              {product.attributes.map((attr: ProductAttr, index) => (
                <ProductAttribute
                  key={index}
                  title={attr.title}
                  value={attr.value}
                />
              ))}

              <PriceTag actual={product.price} discount={null} />

              {canAddToCart ? (
                <AddToCartButton item={{ ...product, qty: 1 }} />
              ) : null}
            </div>
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

const ProductAttribute = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  return (
    <>
      <div className="hidden tabletS:block">{`${title.toUpperCase()}: ${value}`}</div>
    </>
  );
};

export default ProductCard;
