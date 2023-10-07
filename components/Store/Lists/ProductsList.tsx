import Link from "next/link";
import { Product } from "../../../interfaces/Store/Product";
import { ListLayoutMock } from "../Layout/ListLayoutMock";

const data: Product[] = [
  {
    _id: "123",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "124",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "123",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "123",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "124",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "153",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
    desc: [],
  },
  {
    _id: "123",
    name: "Semen",
    images: ["/images/mproduct.png"],
    slug: "se0001-23",
    price: 200,
    modelno: "N/A",
    discount: null,
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

export default ProductList;
