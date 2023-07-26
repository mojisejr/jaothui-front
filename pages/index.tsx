import type { NextPage } from "next";
import Header from "../components/Header";
import FirstSection from "../components/sections/home/First";
import RoadmapSection from "../components/sections/home/Roadmap";
import DetailSection from "../components/sections/home/Details";
import PartnerSection from "../components/sections/home/Partners";
import FooterSection from "../components/sections/home/Footer";
import MenuModal from "../components/MenuModal";
import { useMenu } from "../contexts/menuContext";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { isOpen } = useMenu();
  return (
    <div className="relative bg-thuidark">
      <Header />
      {/* <SectionLayout> */}
      <FirstSection />
      <div className="relative z-30">
        <svg viewBox="0 0 500 70">
          <path
            d="M 0 60 C 170 100 280 0 500 20 L 500 0 L 0 0"
            fill="#E3A51D"
          ></path>
        </svg>
      </div>

      <DetailSection />
      <RoadmapSection />
      <PartnerSection />
      <FooterSection />
      {/* </SectionLayout> */}
      {isOpen ? <MenuModal /> : null}
    </div>
  );
};

export default Home;
