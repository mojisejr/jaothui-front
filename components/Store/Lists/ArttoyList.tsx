import Link from "next/link";
import { useProducts } from "medusa-react";
import { useStore } from "../../../contexts/storeContext-medusa";
import { ListLayout } from "../Layout/ListLayout";
import { useEffect, useState } from "react";
import { Region } from "@medusajs/medusa";
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";
import Loading from "../../Shared/Indicators/Loading";
import { ListLayoutMock } from "../Layout/ListLayoutMock";
import { trpc } from "../../../utils/trpc";

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
  const { data, isLoading, isSuccess, isError, refetch } =
    trpc.store.getByCat.useQuery({
      category: "arttoy",
    });

  console.log(data);

  useEffect(() => {
    refetch();
  }, []);
  // const { currentRegion } = useStore();

  // const { products } = useProducts({
  //   region_id: currentRegion == undefined ? "" : currentRegion!.id!,
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
          {!isLoading ? (
            <>
              {/* <ListLayoutMock products={products} /> */}
              <ListLayout products={data!} />
            </>
          ) : (
            <div className="py-10 text-center">
              <Loading size="lg" />
            </div>
          )}
        </div>
      </>
    </>
  );
};

export default ArttoyProductList;
