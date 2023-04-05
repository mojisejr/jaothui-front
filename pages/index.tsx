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
        <DetailSection />
        <RoadmapSection />
        <PartnerSection />
        <DetailSection />
      </SectionLayout>
    </div>
  );
};

export default Home;
