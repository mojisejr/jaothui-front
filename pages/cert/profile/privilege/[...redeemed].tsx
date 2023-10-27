import React from "react";
import { useRouter } from "next/router";
import { useBitkubNext } from "../../../../contexts/bitkubNextContext";
import Layout from "../../../../components/Layouts";
import RedeemedCard from "../../../../components/Privilege/RedeemedCard";
import Loading from "../../../../components/Shared/Indicators/Loading";

const RedeemDetail = () => {
  const { query, replace } = useRouter();
  const { isConnected } = useBitkubNext();

  if(!isConnected) {
    replace("/unauthorized");
    return;
  }





  return (
    <Layout>
      <div className="h-[95vh] flex justify-center items-center py-10">
        {query.redeemed == undefined ? (
          <Loading size="lg" />
        ) : (
          <RedeemedCard
            tokenId={query.tokenId as string}
            option={query.option as string}
            image={query.image as string}
            error={Boolean(query.error)}
          />
        )}
      </div>
    </Layout>
  );
};

export fault RedeemDetail;
