import Image, { StaticImageData } from "next/image";

export interface GridItemProp {
  image: string | StaticImageData;
  tokenName: string;
  certNo: string;
  microcchip: string;
}

const GridItem = ({ image, tokenName, certNo, microcchip }: GridItemProp) => {
  return (
    <div className="w-full text-thuiwhite flex flex-col justify-center items-center">
      <Image
        className="w-full rounded-md
      max-w-[350px]"
        src={image}
        alt="buffalo-image"
      />
      <div className="pt-2">
        <div>
          {tokenName} #{certNo}
        </div>
        <div>{microcchip}</div>
      </div>
    </div>
  );
};

export default GridItem;
