import React from "react";
import { useRouter } from "next/router";
import MultipleRedeemCard from "../../../../components/Privilege/MultipleRedeemCard";

const RedeemDetail = () => {
  const { query } = useRouter();

  return (
    <div>
      <MultipleRedeemCard _id={query._id as string} />
    </div>
  );
};

export default RedeemDetail;
