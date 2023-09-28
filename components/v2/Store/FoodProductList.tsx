import Link from "next/link";
import ProductCard from "./ProductCard";
import { Product } from "../../../interfaces/Store/Product";

const data: Product[] = [
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    desc: [],
  },
];

const FoodProductList = () => {
  return (
    <>
      <>
        <div className="py-6">
          <div className="flex justify-between items-center px-[22px] py-2">
            <div className="text-xl font-bold">Food Products</div>
            <Link href="#" className="text-sm">
              ดูทั้งหมด{">"}
            </Link>
          </div>
          <div className="grid grid-cols-2 place-items-center tabletS:grid-cols-3 labtop:grid-cols-4 desktopM:grid-cols-6 p-1 gap-1">
            {data
              ? data.map((d, index) => <ProductCard key={index} product={d} />)
              : "Nothing to show"}
          </div>
        </div>
      </>
    </>
  );
};

export default FoodProductList;
