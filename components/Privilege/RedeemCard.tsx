import React, { ReactNode } from "react";

interface RedeemCardProps {
  children: ReactNode;
  title: string;
  description: string;
  imageUrl: string;
}

const RedeemCard = ({
  title,
  description,
  imageUrl,
  children,
}: RedeemCardProps) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <figure>
        <img src={imageUrl} alt="image" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <pre className="text-sm overflow-auto font-sans h-[100px]">{description}</pre>
        <>{children}</>
      </div>
    </div>
  );
};

export default RedeemCard;
