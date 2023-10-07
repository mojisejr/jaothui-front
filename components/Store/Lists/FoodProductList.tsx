import Link from "next/link";
import { Product } from "../../../interfaces/Store/Product";
import { ListLayoutMock } from "../Layout/ListLayoutMock";

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
              <ListLayoutMock products={data} />
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
