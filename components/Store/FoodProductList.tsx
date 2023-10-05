import Link from "next/link";
import ProductCard from "./ProductCard";
import { Product } from "../../interfaces/Store/Product";

const data: Product[] = [
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
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
          {data ? (
            <>
              <div className="px-[2rem] hidden tabletS:grid grid-cols-2 place-items-center tabletS:grid-cols-3 labtop:grid-cols-4 desktopM:grid-cols-6 gap-5">
                {data.map((d, index) => (
                  <ProductCard key={index} product={d} canAddToCart={false} />
                ))}
              </div>
              <div className="px-[2rem] grid grid-cols-2 place-items-center tabletS:grid-cols-3 labtop:grid-cols-4 desktopM:grid-cols-6 gap-5">
                {[data[0], data[1], data[2], data[3]].map((d, index) => (
                  <ProductCard key={index} product={d} canAddToCart={false} />
                ))}
              </div>
            </>
          ) : (
            "Nothing to show"
          )}
        </div>
      </>
    </>
  );
};

export default FoodProductList;
