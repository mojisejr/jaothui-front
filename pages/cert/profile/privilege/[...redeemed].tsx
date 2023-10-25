import React from "react";
import { useRouter } from "next/router";
import { useBitkubNext } from "../../../../contexts/bitkubNextContext";
import Layout from "../../../../components/Layouts";
import RedeemedCard from "../../../../components/Privilege/RedeemedCard";
import Loading from "../../../../components/Shared/Indicators/Loading";

const RedeemDetail = () => {
  const { query } = useRouter();

  console.log(query);

  return (
    <Layout>
      <div className="h-[80vh] flex justify-center items-center">
        {query.redeemed == undefined ? (
          <Loading size="lg" />
        ) : (
          <RedeemedCard
            tokenId={query.redeemed![0]}
            option={query.redeemed![1]}
          />
        )}
      </div>
    </Layout>
  );
};

export default RedeemDetail;
