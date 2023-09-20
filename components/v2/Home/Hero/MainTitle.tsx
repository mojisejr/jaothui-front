import CarouselMenu from "./CarouselMenu";
import Image from "next/image";

const MainTitle = () => {
  return (
    <>
      <div className="flex flex-col items-center text-center text-base-200 pt-8 pb-10">
        <div className="max-w-md">
          <div className="flex justify-center">
            <img
              className="w-[320px] tabletM:w-[400px]"
              src="images/herov2.png"
              alt="hero-image"
            />
          </div>
          <div className="py-3">
            <h1 className="text-6xl">
              JAOTHUI <span className="text-primary font-bold">NFT</span>
            </h1>
            <div className="tracking-tighter text-xl">
              ยกระดับควายไทย ยกระดับการพัฒนาและอนุรักษ์
            </div>
          </div>
          <div className="py-9">
            <CarouselMenu />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainTitle;
