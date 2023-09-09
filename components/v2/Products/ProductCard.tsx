import Link from "next/link";
import Loading from "../Shared/Indicators/Loading";

interface ProductCardProps {
  image?: string;
  title: string;
  price: number | string;
  priceUnit: string;
  detail: string;
}

const ProductCard = ({
  image = "/images/mproduct.png",
  title,
  price,
  priceUnit,
  detail,
}: ProductCardProps) => {
  return (
    <>
      <Link href="#" className="w-full max-w-[320px] rounded-xl shadow-xl">
        <div className="p-4">
          <img className="w-full rounded-xl" src={image} alt="image" />
          <div className="w-full rounded-xl shadow p-3 flex justify-between items-center">
            <div>
              <div className="font-bold text-xl">{title}</div>
              <div className="">{`${priceUnit} ${price} บาท`}</div>
              <div className="text-xl font-bold text-base-300 text-center">
                {detail}
              </div>
            </div>
            <div></div>
          </div>
        </div>
      </Link>
    </>
  );
};

export default ProductCard;
