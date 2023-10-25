import React from "react";
import StoreLayout from "../../../components/Layouts/StoreLayout";
import { trpc } from "../../../utils/trpc";
import Loading from "../../../components/Shared/Indicators/Loading";
import AllProductList from "../../../components/Store/Lists/AllProductList";
import ProductDetailModal from "../../../components/Store/Details/ProductDetailModal";

const FoodProductPage = () => {
  const { data, isLoading: arttoyLoading } = trpc.store.getCollctions.useQuery({
    handle: "food",
  });

  return (
    <StoreLayout
      heroImage="/images/arttoyhero.png"
      title="JAOTHUI"
      subTitle="FOOD"
      smallTitle="From Farm To Table"
    >
      {arttoyLoading ? (
        <div className="h-[200px] w-full flex justify-center items-center">
          <Loading size="lg" /> Loading..
        </div>
      ) : (
        <AllProductList products={data!} title="FOOD" />
      )}
      <ProductDetailModal />
    </StoreLayout>
  );
};

export default FoodProductPage;
