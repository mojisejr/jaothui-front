import Image from "next/image";
import { motion } from "framer-motion";
const PartnerSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full h-full top-[-90px] bg-thuigray pt-[7%] pb-[10%] pr-[5%] pl-[5%]
    tabletS:top-[-100px]
    tabletM:top-[-140px]
    labtop:top-[-160px]
    desktop:top-[-200px]"
    >
      <div>
        <div className="text-thuiwhite text-[35px]">Partners</div>
        <div className="grid grid-cols-4 place-items-center">
          {/* <div className="text-thuiwhite text-3xl">To be announcement</div> */}
          <Image
            className="w-[100px]
            labtop:w-[150px]
            "
            src="/images/bittoonLogo.png"
            width={500}
            height={500}
            alt={"bittoon"}
          />
          <Image
            className="w-[150px]
            labtop:w-[200px]"
            src="/images/digLogo.png"
            width={500}
            height={500}
            alt={"digdragon"}
          />
          <Image
            className="w-[150px]
            labtop:w-[200px]"
            src="/images/stockerLogo.png"
            width={500}
            height={500}
            alt={"stockerdao"}
          />
          <Image
            className="w-[150px]
            labtop:w-[200px]
            "
            src="/images/tripsterLogo.png"
            width={500}
            height={500}
            alt={"tripster"}
          />
          <Image
            className="w-[150px]
            labtop:w-[300px]
            "
            src="/images/maxyLogo.png"
            width={500}
            height={500}
            alt={"maxyverse"}
          />
          {/* <Image
            className="w-[100px]
            labtop:w-[200px]"
            src="/images/tpcxLogo.png"
            width={500}
            height={500}
            alt={"tpcx"}
          /> */}
          <Image
            className="w-[80px]
            labtop:w-[150px]
            "
            src="/images/nft360.png"
            width={500}
            height={500}
            alt={"360"}
          />
          <Image
            className="w-[100px]
            labtop:w-[200px]"
            src="/images/chickLogo.png"
            width={500}
            height={500}
            alt={"chickendao"}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default PartnerSection;
