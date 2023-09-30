import type { NextPage } from "next";
import CookieConsent from "react-cookie-consent";
import Layout from "../components/Layouts";
import Hero from "../components/Home/Hero";
import MainTitle from "../components/Home/Hero/MainTitle";
import Pedigree from "../components/Home/Pedigree";
import ProductList from "../components/Store/ProductsList";
import FoodProductList from "../components/Store/FoodProductList";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  return (
    <div className="relative">
      <Layout>
        {/* <MainTitle2 /> */}
        <Hero>
          <MainTitle />
        </Hero>
        <Pedigree />
        <ProductList />
        <FoodProductList />
      </Layout>
      <CookieConsent buttonText="Thank You, I Accept">
        Welcome to Jaothui Website! We want to provide you with the best user
        experience possible, so we use cookies to enhance your browsing
        experience.
      </CookieConsent>
    </div>
  );
};

export default Home;
