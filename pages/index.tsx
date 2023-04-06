import type { NextPage } from "next";
import Head from "next/head";
import Header from "../components/Header";
import FirstSection from "../components/sections/First";
import RoadmapSection from "../components/sections/Roadmap";
import DetailSection from "../components/sections/Details";
import PartnerSection from "../components/sections/Partners";
import SectionLayout from "../components/sections/SectionLayout";
import FooterSection from "../components/sections/Footer";

const Home: NextPage = () => {
  return (
    <div>
      <Header />
      {/* <SectionLayout> */}
      <FirstSection />
      <div className="relative z-30">
        <svg viewBox="0 0 500 200">
          <path
            d="M 0 30 C 170 100 280 0 500 20 L 500 0 L 0 0"
            fill="#E3A51D"
          ></path>
        </svg>
      </div>

      <DetailSection />
      <RoadmapSection />
      <PartnerSection />
      <FooterSection />
      {/* </SectionLayout> */}
    </div>
  );
};

export default Home;
