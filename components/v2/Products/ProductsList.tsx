import Link from "next/link";
import ProductCard from "./ProductCard";

const data = [
  {
    title: "น้ำเชื้อ",
    price: "----",
    priceUnit: "หลอดละ",
    detail: "Comingsoon..",
  },
  {
    title: "น้ำเชื้อ",
    price: "----",
    priceUnit: "หลอดละ",
    detail: "Comingsoon..",
  },
  {
    title: "น้ำเชื้อ",
    price: "----",
    priceUnit: "หลอดละ",
    detail: "Comingsoon..",
  },
  {
    title: "น้ำเชื้อ",
    price: "----",
    priceUnit: "หลอดละ",
    detail: "Comingsoon..",
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
              ? data.map((d, index) => (
                  <ProductCard
                    key={index}
                    unit="บาท"
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

export default ProductList;