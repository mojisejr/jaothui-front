import { AiFillFacebook, AiFillTwitterCircle } from "react-icons/ai";
import { SiDiscord } from "react-icons/si";

export default function FooterSection() {
  return (
    <div
      className="relative w-full top-[-170px] h-full bg-thuidark bg-opacity-[0.955] pt-[2%] pr-[5%] pl-[5%] text-thuiwhite 
    tabletS:top-[-300px]
    tabletM:top-[-400px]
    labtop:top-[-550px]
    desktop:top-[-700px]
    "
    >
      <div className="flex gap-10 items-center">
        <div className="text-[35px] flex-none">FOLLOW US</div>
        <div className="border-b-[3px] flex-1"></div>
      </div>
      <div className="flex flex-col gap-[20px] mt-[10px]">
        <div className="flex items-center gap-[20px]">
          <AiFillFacebook size={100} /> Facebook
        </div>
        <div className="flex items-center gap-[20px]">
          <AiFillTwitterCircle size={100} /> Twitter
        </div>
        <div className="flex items-center gap-[20px]">
          <SiDiscord size={100} /> Discord
        </div>
      </div>
    </div>
  );
}
