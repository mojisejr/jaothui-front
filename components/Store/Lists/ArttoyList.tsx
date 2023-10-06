import Link from "next/link";
import ProductCard from "../ProductCard";
import { useProducts } from "medusa-react";
import { useStore } from "../../../contexts/storeContext";
import MockProductCard from "../MockProduct";
import { ListLayout } from "../Layout/ListLayout";

const products = [
  {
    _id: "123",
    name: "Model: 0001-23",
    images: ["/images/marttoy1.png"],
    slug: "se0001-23",
    price: 1800,
    modelno: "N/A",
    discount: null,
    desc: [
      {
        title: "Color",
        value: "White",
      },
    ],
  },
  {
    _id: "123",
    name: "Model: 0003-23",
    images: ["/images/marttoy2.png"],
    slug: "se0001-23",
    price: 2000,
    modelno: "N/A",
    discount: null,
    desc: [
      {
        title: "Color",
        value: "Gold",
      },
    ],
  },
  {
    _id: "123",
    name: "Model: H001-23",
    images: ["/images/marttoy3.png"],
    slug: "se0001-23",
    price: 199,
    modelno: "N/A",
    discount: null,
    desc: [
      {
        title: "Color",
        value: "White",
      },
    ],
  },
  {
    _id: "123",
    name: "Model: B001-23",
    images: ["/images/marttoy4.png"],
    slug: "se0001-23",
    price: 199,
    modelno: "N/A",
    discount: null,
    desc: [
      {
        title: "Color",
        value: "Black",
      },
    ],
  },
];

const ArttoyProductList = () => {
  const { currentRegion } = useStore();
  // const { products } = useProducts({
  //   region_id: currentRegion!.id!,
  // });

  return (
    <>
      <>
        <div className="py-6">
          <div className="flex justify-between items-center px-[22px] py-2">
            <div className="text-xl font-bold">Arttoy</div>
            <Link href="#" className="text-sm">
              ดูทั้งหมด{">"}
            </Link>
          </div>
          {products ? (
            <>
              <ListLayout products={products} />
            </>
          ) : (
            "Nothing to show"
          )}
        </div>
      </>
    </>
  );
};

export default ArttoyProductList;
