import React from "react";
import Image from "next/image";
import Link from "next/link";

interface GameListCardProps {
  _id: string;
  title: string;
  thumbnailImage?: string;
  description?: string;
  type: string;
}

const GameListCard = ({
  _id,
  title,
  description,
  thumbnailImage,
  type,
}: GameListCardProps) => {
  return (
    <div className="card card-side bg-base-100 shadow-xl">
      <div className="p-1 flex justify-center items-center">
        <figure className="w-36 rounded-2xl overflow-hidden">
          {thumbnailImage == undefined ? (
            <Image src="/images/N.jpg" width={1000} height={1000} alt={title} />
          ) : (
            <Image
              src={thumbnailImage}
              width={1000}
              height={1000}
              alt={title}
            />
          )}
        </figure>
      </div>

      <div className="card-body">
        <div>
          <h2 className="text-md font-bold">{title}</h2>
          <p className="text-xs">{description}</p>
        </div>
        <div className="card-actions justify-end">
          <Link
            className="btn btn-primary btn-sm"
            href={`/profile/game/${type}`}
          >
            enter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GameListCard;
