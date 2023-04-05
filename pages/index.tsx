import type { NextPage } from "next";
import Head from "next/head";
import Header from "../components/Header";
import FirstSection from "../components/sections/First";
import RoadmapSection from "../components/sections/Roadmap";
import DetailSection from "../components/sections/Details";
import PartnerSection from "../components/sections/Partners";
import SectionLayout from "../components/sections/SectionLayout";

const Home: NextPage = () => {
  return (
    <div>
      <Header />
      <SectionLayout>
        <FirstSection />
        <svg viewBox="0 0 500 200">
          <path
            d="M 0 30 C 150 100 280 0 500 20 L 500 0 L 0 0"
            fill="#E3A51D"
          ></path>
        </svg>
        <DetailSection />
        <RoadmapSection />
        <PartnerSection />
        <DetailSection />
      </SectionLayout>
    </div>
  );
};

export default Home;
