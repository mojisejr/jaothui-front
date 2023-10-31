import React, { ReactNode } from "react";
import { useRouter } from 'next/router';

interface RedeemCardProps {
  tokenId: string;
  option: string;
  image: string;
  error?: boolean;
}

const RedeemedCard = ({ tokenId, image, option, error = false }: RedeemCardProps) => {

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <figure>
        <img src={image} alt="image"/>
      </figure>
      <div className="card-body text-center">
        <h2 className="text-2xl font-bold">
          Redeemed with token
        </h2>
        <h3 className="text-xl font-bold text-dark">
        #{tokenId}
        </h3>
        <div className="flex flex-col gap-2">
          <h3 className="divider">Redeemed Item</h3>
          <div className={`text-xl ${!error ? "text-dark" : "text-error"} font-bold`}>{option}</div>
        </div>
        <p className="text-error py-1">
          **Do not close this window until you claimed item at the redemption
          station.
        </p>
      </div>
    </div>
  );
};

export default RedeemedCard;
