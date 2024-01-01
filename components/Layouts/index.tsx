import { ReactNode, SyntheticEvent, useRef } from "react";
import BottomNav from "../Shared/Navbar/Bottom";
import { HiMenuAlt2 } from "react-icons/hi";
import { BiSearchAlt2 } from "react-icons/bi";
import LoginWithLineButton from "../Shared/Buttons/LoginWithLine";
import Link from "next/link";
import FooterSection from "../Shared/Footer";
import { useRouter } from "next/router";
import { useBitkubNext } from "../../contexts/bitkubNextContext";

import CartButton from "../Cart/Buttons/CartButton";
import Head from "next/head";
import MenuList from "../Shared/Navbar/MenuList";

interface LayoutProps {
  children: ReactNode;
}
const Layout = ({ children }: LayoutProps) => {
  const { pathname, push, query } = useRouter();
  const { tokenId } = query;
  const searchRef = useRef<HTMLInputElement>(null);
  const { isConnected } = useBitkubNext();

  console.log(`http://localhost:3000/api/og?tokenId=${tokenId}`);

  function handleSearch(e: SyntheticEvent) {
    const value =
      searchRef.current?.value == undefined ? 0 : +searchRef.current.value;

    if (value <= 0) {
      return;
    }

    push(`/cert/${value}`);
  }

  return (
    <>
      <div className="drawer">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Navbar */}
          <div className="navbar bg-base-200 bg-opacity-60 px-[22px] sticky top-0 left-0 z-[1]">
            <div className="navbar-start">
              <label htmlFor="my-drawer-3" className="btn btn-square btn-ghost">
                <HiMenuAlt2 size={24} />
              </label>
            </div>
            <div className="navbar-center">
              <div className="tabs bg-base-200 rounded-full p-1">
                <Link
                  href="/"
                  className={`tab ${
                    pathname.includes("arttoy")
                      ? null
                      : "bg-primary text-neutral"
                  } font-bold rounded-full`}
                >
                  PED
                </Link>
                <Link
                  href="/store/arttoy"
                  className={`tab ${
                    pathname.includes("arttoy")
                      ? "bg-primary text-neutral"
                      : null
                  } font-bold rounded-full`}
                >
                  ART
                </Link>
              </div>
            </div>
            <div className="navbar-end flex items-center gap-2">
              <Link href="/cart">
                <CartButton />
              </Link>
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-primary btn-circle">
                  <BiSearchAlt2 size={24} />
                </label>
                <div
                  tabIndex={0}
                  className="dropdown-content z-[1] menu p-2 shadow bg-base-200 w-52"
                >
                  <div className="join">
                    <input
                      className="input join-item w-3/4"
                      placeholder="Microchip Id"
                      ref={searchRef}
                    />
                    <button
                      onClick={handleSearch}
                      className="btn btn-primary join-item w-1/4"
                    >
                      Go!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              content={`http://localhost:3000/api/og?tokenId=${tokenId}`}
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
          {children}
          <FooterSection />
          <BottomNav />
        </div>
        <MenuList />
      </div>
    </>
  );
};

export default Layout;
