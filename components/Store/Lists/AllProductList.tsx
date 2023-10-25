import { ListLayout } from "../Layout/ListLayout";
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";

interface AllProductListProps {
  products: PricedProduct[] | any[];
  title: string;
}

const AllProductList = ({ products, title }: AllProductListProps) => {
  return (
    <>
      <>
        <div className="py-6">
          <div className="flex justify-between items-center px-[22px] py-2">
            <div className="text-xl font-bold">{title}</div>
          </div>
          {products && products.length > 0 ? (
            <>
              <ListLayout products={products} />
            </>
          ) : (
            <div className="text-center">Nonthing To Show</div>
          )}
        </div>
      </>
    </>
  );
};

export default AllProductList;
