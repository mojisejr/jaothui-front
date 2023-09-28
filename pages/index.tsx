import type { NextPage } from "next";
import CookieConsent from "react-cookie-consent";
import Layout from "../components/v2/Layouts";
import Hero from "../components/v2/Home/Hero";
import MainTitle from "../components/v2/Home/Hero/MainTitle";
import Pedigree from "../components/v2/Home/Pedigree";
import ProductList from "../components/v2/Store/ProductsList";
import FoodProductList from "../components/v2/Store/FoodProductList";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  return (
    <div className="relative">
      <Layout>
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
