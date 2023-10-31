import React from "react";
import StoreLayout from "../../../components/Layouts/StoreLayout";
import { trpc } from "../../../utils/trpc";
import Loading from "../../../components/Shared/Indicators/Loading";
import AllProductList from "../../../components/Store/Lists/AllProductList";
import ProductDetailModal from "../../../components/Store/Details/ProductDetailModal";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import { useRouter } from "next/router";

const NonFoodProductPage = () => {
  const { replace } = useRouter();
  const { isConnected } = useBitkubNext();
  const { data, isLoading: arttoyLoading } = trpc.store.getCollctions.useQuery({
    handle: "non-food",
  });

  if(!isConnected) {
    replace('/unauthorized');
    return;
  }

  return (
    <StoreLayout
      heroImage="/images/arttoyhero.png"
      title="JAOTHUI"
      subTitle="PRODUCT"
      smallTitle="Best Selection form our best practice."
    >
      {arttoyLoading ? (
        <div className="h-[200px] w-full flex justify-center items-center">
          <Loading size="lg" /> Loading..
        </div>
      ) : (
        <AllProductList products={data!} title="PRODUCT" />
      )}
      <ProductDetailModal />
    </StoreLayout>
  );
};

export default NonFoodProductPage;
