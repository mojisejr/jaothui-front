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

  if (!isConnected) {
    replace("/unauthorized");
    return;
  }

  return (
    <StoreLayout
      heroImage="/images/arttoyhero.png"
      title="JAOTHUI"
      subTitle="PRODUCT"
      smallTitle="Best Selection form our best practice."
    >
      <ProductDetailModal />
    </StoreLayout>
  );
};

export default NonFoodProductPage;
