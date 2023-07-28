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
        <div className="grid tabletS:grid-cols-3 grid-cols-1 place-items-center">
          <Image
            className=""
            src="/images/STP.png"
            width={500}
            height={500}
            alt={"STP"}
          />
          <Image
            className=""
            src="/images/NP.png"
            width={500}
            height={500}
            alt={"NP"}
          />
          <Image
            className=""
            src="/images/PP.png"
            width={500}
            height={500}
            alt={"PP"}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default PartnerSection;
