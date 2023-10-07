import { Product } from "../../../interfaces/Store/Product";
import { ReactNode } from "react";
import MockProductCard from "../MockProduct";

interface ListLayoutProps {
  products: Product[];
}

export const ListLayoutMock = ({ products }: ListLayoutProps) => {
  return (
    <div>
      <div className="px-[8rem] hidden tabletS:grid grid-cols-2 place-items-center tabletS:grid-cols-3 labtop:grid-cols-6  gap-2">
        {products.map((d, index) => (
          <MockProductCard key={index} product={d} canAddToCart={false} />
        ))}
      </div>
      <div className="px-[1rem] tabletS:hidden grid grid-cols-2 place-items-center gap-5">
        {[products[0], products[1], products[2], products[3]].map(
          (d, index) => (
            <MockProductCard key={index} product={d} canAddToCart={false} />
          )
        )}
      </div>
    </div>
  );
};
