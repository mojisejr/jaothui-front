import { EffectCoverflow, Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { GiMicrochip, GiTrophyCup } from "react-icons/gi";
import { BsPostcard, BsGenderAmbiguous } from "react-icons/bs";
import { FaBirthdayCake, FaDna } from "react-icons/fa";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

const CarouselMenu = () => {
  return (
    <>
      <div className="w-full ">
        <Swiper
          effect={"coverflow"}
          grabCursor={true}
          centeredSlides={true}
          loop={true}
          slidesPerView={3}
          mousewheel={true}
          coverflowEffect={{
            slideShadows: true,
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2.5,
          }}
          modules={[EffectCoverflow, Scrollbar]}
        >
          <SwiperSlide>
            <div className="flex flex-col justify-center items-center">
              <button className="btn btn-circle btn-lg hover:btn-primary">
                <GiMicrochip size={40} />
              </button>
              <div>Microchip</div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="flex flex-col justify-center items-center">
              <button className="btn btn-circle btn-lg hover:btn-primary">
                <BsPostcard size={40} />
              </button>
              <div>Name</div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="flex flex-col justify-center items-center">
              <button className="btn btn-circle btn-lg hover:btn-primary">
                <BsGenderAmbiguous size={40} />
              </button>
              <div>Sex</div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="flex flex-col justify-center items-center">
              <button className="btn btn-circle btn-lg hover:btn-primary">
                <GiTrophyCup size={40} />
              </button>
              <div>Reward</div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="flex flex-col justify-center items-center">
              <button className="btn btn-circle btn-lg hover:btn-primary">
                <FaBirthdayCake size={40} />
              </button>
              <div>Birthday</div>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="flex flex-col justify-center items-center">
              <button className="btn btn-circle btn-lg hover:btn-primary">
                <FaDna size={40} />
              </button>
              <div>GNOME</div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </>
  );
};

export default CarouselMenu;
