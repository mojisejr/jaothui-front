import Link from "next/link";
import ProductCard from "../Store/ProductCard";
import { trpc } from "../../../utils/trpc";

// const data = [
//   {
//     image: "/images/marttoy1.png",
//     title: "Model: 0001-23",
//     price: "White",
//     priceUnit: "Color:",
//     detail: "รายละเอียด",
//   },
//   {
//     image: "/images/marttoy2.png",
//     title: "Model: 0003-23",
//     price: "Gold",
//     priceUnit: "Color:",
//     detail: "รายละเอียด",
//   },
//   {
//     image: "/images/marttoy3.png",
//     title: "Model: H001-23",
//     price: "White",
//     priceUnit: "Color:",
//     detail: "รายละเอียด",
//   },
//   {
//     image: "/images/marttoy4.png",
//     title: "Model: B001-23",
//     price: "Black",
//     priceUnit: "Color:",
//     detail: "รายละเอียด",
//   },
// ];

const ArttoyProductList = () => {
  const { data, isLoading } = trpc.store.get.useQuery();
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
          <div className="p-1 grid grid-cols-2 place-items-center tabletS:grid-cols-3 labtop:grid-cols-4 desktopM:grid-cols-6 gap-1">
            {data
              ? data.map((product) => (
                  <ProductCard key={product._id} product={product!} />
                ))
              : "Nothing to show"}
          </div>
        </div>
      </>
    </>
  );
};

export default ArttoyProductList;
