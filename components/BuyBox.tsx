import Image from "next/image";
import thui from "../public/images/First1.png";
import Link from "next/link";

const BuyBox = () => {
  return (
    <div
      className="relative p-5 flex flex-col items-center
    tabletS:right-[-14%]
    tabletS:top-[25%]
    tabletS:w-full
    tabletM:right-[-30%]
    labtop:top-[30%]
    labtop:right-[-25%]
    "
    >
      <Image
        className="w-[300px]
      tabletS:absolute
      tabletS:top-[-40%]
      tabletS:left-[-33%]
      tabletS:w-[400px]
      tabletM:top-[-60%]
      tabletM:left-[-70%]
      tabletM:w-[580px]
      labtop:top-[-80%]
      labtop:left-[-60%]
      labtop:w-[650px]
      "
        src={thui}
        width={400}
        alt="thui image"
      />
      <div className="text-thuiwhite">
        <div
          className="text-[20px]
        tabletS:text-[25px]
        tabletM:text-[30px]
        labtop:text-[45px]
        "
        >
          เจ้าทุย NFT ที่ผสมระหว่างความเป็นไทย
        </div>
        <div
          className="text-[20px]
        tabletS:text-[20px]
        tabletM:text-[25px]
        labtop:text-[30px]"
        >
          กับเทคโนโลยีดิจิทัล ด้วยคาแรคเตอร์ &apos;ควายไทย&apos;
        </div>
      </div>
      <div className="flex justify-center mt-3 gap-2">
        <Link
          className="pl-[10px] pr-[10px] pb-[5px] pt-[5px] rounded-[30px] bg-thuigray text-thuiyellow text-[35px]
          hover:text-thuiwhite
          hover:shadow-2xl
          transition-all 1s"
          href="/whitepaper.pdf"
        >
          Whitepaper
        </Link>
        <button
          className="pl-[10px] pr-[10px] pb-[5px] pt-[5px] rounded-[30px] bg-thuigray text-thuiyellow text-[35px]
          hover:text-thuiwhite
          hover:shadow-2xl
          transition-all 1s"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default BuyBox;
