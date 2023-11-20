import Link from "next/link";
import { Product } from "../../../interfaces/Store/Product";
import { ListLayoutMock } from "../Layout/ListLayoutMock";

const data: Product[] = [
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    category: "food",
    price: 200,
    isDiscount: false,
    inStock: true,
    discount: 0,
    description: "",
    attributes: [],
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    category: "food",
    attributes: [],
    isDiscount: false,
    inStock: true,
    discount: null,
    description: "",
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    category: "food",
    attributes: [],
    isDiscount: false,
    inStock: true,
    discount: null,
    description: "",
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    category: "food",
    attributes: [],
    isDiscount: false,
    inStock: true,
    discount: null,
    description: "",
  },
  {
    _id: "153",
    name: "Buff Roast",
    images: ["/images/mfoodproduct.png"],
    slug: "se0001-23",
    price: 200,
    category: "food",
    attributes: [],
    isDiscount: false,
    inStock: true,
    discount: null,
    description: "",
  },
];

const FoodProductList = () => {
  return (
    <>
      <>
        <div className="py-6">
          <div className="flex justify-between items-center px-[22px] py-2">
            <div className="text-xl font-bold">Food Products</div>
            <Link href="/store/food" className="text-sm">
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
