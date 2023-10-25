import React, { ReactNode } from "react";

interface RedeemCardProps {
  tokenId: string;
  option: string;
}

const RedeemedCard = ({ tokenId, option }: RedeemCardProps) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-3xl font-bold text-[#00ff2a]">
          🎉 Redeemed 🎉
        </h2>
        <h3 className="text-2xl font-bold text-info">
          with Jaothui #{tokenId}
        </h3>
        <div className="flex flex-col gap-2">
          <h3 className="divider">Redeemed Item</h3>
          <div className="text-2xl text-success font-bold">{option}</div>
        </div>
        <div className="divider"></div>
        <p className="text-error">
          **Do not close this window until you claimed item at the redemption
          station.
        </p>
      </div>
    </div>
  );
};

export default RedeemedCard;
