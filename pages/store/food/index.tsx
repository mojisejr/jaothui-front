import React from "react";
import StoreLayout from "../../../components/Layouts/StoreLayout";
import { trpc } from "../../../utils/trpc";
import Loading from "../../../components/Shared/Indicators/Loading";
import AllProductList from "../../../components/Store/Lists/AllProductList";
import ProductDetailModal from "../../../components/Store/Details/ProductDetailModal";
import { useRouter } from "next/router";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";

const FoodProductPage = () => {
  const { replace } = useRouter();
  const { isConnected } = useBitkubNext();

  if (!isConnected) {
    replace("/unauthorized");
    return;
  }

  return (
    <StoreLayout
      heroImage="/images/arttoyhero.png"
      title="JAOTHUI"
      subTitle="FOOD"
      smallTitle="From Farm To Table"
    >
      <ProductDetailModal />
    </StoreLayout>
  );
};

export default FoodProductPage;
