import thui from "../public/images/thuiTitle.png";
import Image from "next/image";

export default function Title() {
  return (
    <div
      className="w-full bg-thuigray pt-[6%] pb-[6%] pr-[6%] pl-[6%] rounded-[35px] relative text-center
      tabletS:w-[600px]
      tabletS:text-left
      tabletS:pl-[8%]
      tabletS:pr-[8%]
      tabletS:pt-[6%]
      tabletS:pb-[6%]
      labtop:w-[900px]
      labtop:pl-[8%]
      labtop:pr-[8%]
      labtop:pt-[3%]
      labtop:pb-[3%]
    "
    >
      <div>
        <div
          className="text-[38px] font-bold text-thuiwhite tracking-[1px]
        tabletS:text-[50px]
        tabletS:tracking-[3px]
        labtop:text-[70px]
        labtop:tracking-[4px]
        "
        >
          <span className="text-thuiyellow">JAOTHUI</span> NFT
        </div>
        <div
          className="text-[16px] tracking-[0.2px] leading-[20px] text-thuiwhite
        tabletS:text-[23px]
        tabletS:tracking-[0.5px]
        tabletS:leading-[29px]
        labtop:text-[32px]
        labtop:tracking-[0.5px]
        labtop:leading-[40px]
        "
        >
          <div>ยกระดับควายไทย ยกระดับการอนุรักษ์</div>
          <div>
            กับ <span className="text-thuiyellow">JAOTHUI NFT</span> COLLECTION
          </div>
        </div>
      </div>
      <div
        className={`hidden 
        tabletS:block
        tabletS:absolute
        tabletS:top-[19px]
        tabletS:right-[13px]
        labtop:top-[-71.5px]
        labtop:right-[5px]
      `}
      >
        <Image
          className="tabletS:w-[180px]
          labtop:w-[300px]
          "
          src={thui}
          height={450}
          alt={"thui image"}
        />
      </div>
    </div>
  );
}
