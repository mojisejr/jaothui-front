import Link from "next/link";
import ProductCard from "./ProductCard";
import { Product } from "../../interfaces/Store/Product";

const data: Product[] = [
  {
    _id: "123",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    desc: [],
  },
  {
    _id: "124",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    desc: [],
  },
  {
    _id: "153",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    desc: [],
  },
  {
    _id: "123",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    desc: [],
  },
];

const ProductList = () => {
  return (
    <>
      <>
        <div className="py-6">
          <div className="flex justify-between items-center px-[22px] py-2">
            <div className="text-xl font-bold">Products</div>
            <Link href="#" className="text-sm">
              ดูทั้งหมด{">"}
            </Link>
          </div>
          <div className="p-1 grid grid-cols-2 place-items-center tabletS:grid-cols-3 labtop:grid-cols-4 desktopM:grid-cols-6 gap-1">
            {data
              ? data.map((d, index) => <ProductCard key={index} product={d} />)
              : "Nothing to show"}
          </div>
        </div>
      </>
    </>
  );
};

export default ProductList;
