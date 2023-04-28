import Image, { StaticImageData } from "next/image";
import { motion } from "framer-motion";

export interface GridItemProp {
  image: string | StaticImageData;
  tokenName: string;
  certNo: string | number;
  microcchip: string | number;
}

const GridItem = ({ image, tokenName, certNo, microcchip }: GridItemProp) => {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
      className="w-full text-thuiwhite flex flex-col justify-center items-center"
    >
      <div
        className="p-2 rounded-md transition-all 1.5s border-[1px] border-thuiwhite border-opacity-20
      hover:shadow-xl
      hover:bg-thuidark
      hover:text-thuiyellow
      hover:border-thuidark
      "
      >
        <Image
          className="w-full rounded-md border-[1px] border-thuiwhite border-opacity-5
      max-w-[350px]
      "
          width={250}
          height={250}
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
    </motion.div>
  );
};

export default GridItem;
