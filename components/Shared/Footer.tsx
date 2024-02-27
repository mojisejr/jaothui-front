import Link from "next/link";
import { AiFillFacebook, AiFillTwitterCircle } from "react-icons/ai";
import { SiDiscord } from "react-icons/si";

const FooterSection = () => {
  return (
    <div
      className="w-full h-full bg-thuidark bg-opacity-[0.955] py-10 mb-10 tabletS:mb-0 pr-[5%] pl-[5%] text-thuiwhite 
    "
    >
      <div className="flex gap-10 items-center">
        <div className="text-[35px] flex-none">FOLLOW US</div>
        <div className="border-b-[3px] flex-1"></div>
      </div>
      <div className="flex flex-col gap-[20px] mt-[10px] text-[25px]">
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
    </div>
  );
};

export default FooterSection;
