import CarouselMenu from "./CarouselMenu";

const MainTitle = () => {
  return (
    <>
      <div className="hero-content text-center text-base-200 mb-[8rem]">
        <div className="max-w-md">
          <div className="flex justify-center">
            <img src="images/herov2.png" alt="hero-image" />
          </div>
          <h1 className="text-5xl">
            JAOTHUI <span className="text-primary font-bold">NFT</span>
          </h1>
          <div className="tracking-tighter">
            ยกระดับควายไทย ยกระดับการพัฒนาและอนุรักษ์
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
