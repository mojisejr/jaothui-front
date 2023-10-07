import CarouselMenu from "./CarouselMenu";
import Image from "next/image";

const MainTitle = () => {
  return (
    <>
      <div
        className="grid grid-cols-1 text-center text-base-200 
      tabletS:grid-cols-12"
      >
        <div className="flex justify-center col-span-5">
          <img
            className="w-[80vw] labtop:w-[25vw]"
            src="images/herov2.png"
            alt="hero-image"
          />
        </div>
        <div className="py-3 w-full flex flex-col justify-center col-span-7">
          <h1
            className="text-5xl
          tabletS:text-6xl"
          >
            JAOTHUI <span className="text-primary font-bold">NFT</span>
          </h1>
          <div
            className="tracking-tighter
          tabletS:text-xl"
          >
            ยกระดับควายไทย ยกระดับการพัฒนาและอนุรักษ์
          </div>
          <div className="py-9 tabletS:py-3 z-[1]">
            <CarouselMenu />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainTitle;
