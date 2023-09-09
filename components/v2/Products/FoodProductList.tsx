import Link from "next/link";
import ProductCard from "./ProductCard";

const data = [
  {
    title: "Buff Roast",
    price: "----",
    priceUnit: "ไม้ละ",
    detail: "Comingsoon..",
  },
  {
    title: "Buff Roast",
    price: "----",
    priceUnit: "ไม้ละ",
    detail: "Comingsoon..",
  },
  {
    title: "Buff Roast",
    price: "----",
    priceUnit: "ไม้ละ",
    detail: "Comingsoon..",
  },
  {
    title: "Buff Roast",
    price: "----",
    priceUnit: "ไม้ละ",
    detail: "Comingsoon..",
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
              ? data.map((d, index) => (
                  <ProductCard
                    image="/images/mfoodproduct.png"
                    unit="บาท"
                    key={index}
                    title={d.title}
                    price={d.price}
                    priceUnit={d.priceUnit}
                    detail={d.detail}
                  />
                ))
              : "Nothing to show"}
          </div>
        </div>
      </>
    </>
  );
};

export default FoodProductList;
