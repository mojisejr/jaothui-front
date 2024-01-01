import type { NextPage } from "next";
import CookieConsent from "react-cookie-consent";
import Layout from "../components/Layouts";
import Hero from "../components/Home/Hero";
import MainTitle from "../components/Home/Hero/MainTitle";
import Pedigree from "../components/Home/Pedigree";
import ProductList from "../components/Store/Lists/ProductsList";
import FoodProductList from "../components/Store/Lists/FoodProductList";
import { ToastContainer } from "react-toastify";
import Head from "next/head";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const { pathname, push, query } = useRouter();
  const { tokenId } = query;
  return (
    <div className="relative">
      <Head>
        <title>Jaothui Official</title>
        <meta
          key="keywords"
          name="keywords"
          content={`Jaothui, JaothuiNFT, NFT, Pedigree, Kwaithai, Jaothui Official`}
        />
        <meta
          key="og-title"
          name="og:title"
          property="og:title"
          content={`Jaothui NFT Official`}
        />
        <meta
          key="og-description"
          name="og:description"
          property="og:description"
          content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
        />
        <meta
          key="og-url"
          name="og:url"
          property="og:url"
          content={`https://jaothui.com`}
        />
        <meta
          key="og-image"
          name="og:image"
          property="og:image"
          // content={`https://nftstorage.link/ipfs/bafkreifuxnild7y5degh4bt4puu3cnkk6r74cqcboukih5rwipr2xzaeoy`}
          content={`https://jaothui.com/api/og?tokenId=${tokenId}`}
          // content={`http://localhost:3000/api/og?tokenId=${tokenId}`}
        />
        <meta
          key="twitter-title"
          name="twitter:title"
          content={"Jaothui NFT Official"}
        />
        <meta
          key="twitter-description"
          name="twitter:description"
          content="ยกระดับควายไทย ยกระดับการอนุรักษ์ ส่งควายไทย ให้โด่งดังไปสู่ Global กับโปรเจกต์ ‘JAOTHUI NFT’"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@jaothui" />
        <meta
          name="twitter:image"
          content={`https://nftstorage.link/ipfs/bafkreifuxnild7y5degh4bt4puu3cnkk6r74cqcboukih5rwipr2xzaeoy`}
        />

        <link rel="canonical" href="https://jaothui.com/" />
      </Head>
      <Layout>
        {/* <MainTitle2 /> */}
        <Hero>
          <MainTitle />
        </Hero>
        <Pedigree />
        <ProductList />
        <FoodProductList />
      </Layout>
      <ToastContainer />
      <CookieConsent buttonText="Thank You, I Accept">
        Welcome to Jaothui Website! We want to provide you with the best user
        experience possible, so we use cookies to enhance your browsing
        experience.
      </CookieConsent>
    </div>
  );
};

export default Home;
