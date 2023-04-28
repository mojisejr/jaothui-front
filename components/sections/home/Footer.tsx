import Link from "next/link";
import { AiFillFacebook, AiFillTwitterCircle } from "react-icons/ai";
import { SiDiscord } from "react-icons/si";
import { motion } from "framer-motion";

const FooterSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full top-[-90px] h-full bg-thuidark bg-opacity-[0.955] pt-[10%] pr-[5%] pl-[5%] text-thuiwhite 
    tabletS:top-[-100px]
    tabletM:top-[-140px]
    labtop:top-[-156px]
    desktop:top-[-200px]
    "
    >
      <div className="flex gap-10 items-center">
        <div className="text-[35px] flex-none">FOLLOW US</div>
        <div className="border-b-[3px] flex-1"></div>
      </div>
      <div className="flex flex-col gap-[20px] mt-[10px]">
        <Link
          className="flex items-center gap-[20px] hover:text-thuiyellow transition-[2s]"
          href="https://www.facebook.com/jaothui"
        >
          <AiFillFacebook size={50} /> Facebook
        </Link>
        <Link
          className="flex items-center gap-[20px] hover:text-thuiyellow transition-[2s]"
          href="https://twitter.com/jaothui_nft"
        >
          <AiFillTwitterCircle size={50} /> Twitter
        </Link>
        <Link
          className="flex items-center gap-[20px] hover:text-thuiyellow transition-[2s]"
          href="https://discord.gg/tPZYZ5rjc7"
        >
          <SiDiscord size={50} /> Discord
        </Link>
      </div>
    </motion.div>
  );
};

export default FooterSection;
