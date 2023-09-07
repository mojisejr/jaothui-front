import { ReactNode, SyntheticEvent, useRef } from "react";
import BottomNav from "../Shared/Navbar/Bottom";
import { HiMenuAlt2 } from "react-icons/hi";
import { BiSearchAlt2 } from "react-icons/bi";
import { AiFillCaretRight } from "react-icons/ai";
import LoginWithLineButton from "../Shared/Buttons/LoginWithLine";
import Link from "next/link";
import FooterSection from "../../sections/home/Footer";
import BitkubNextConnectButton from "../../BitkubNext";
import { useRouter } from "next/router";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import BitkubDisconnectButton from "../../BitkubNextDiscon";

interface LayoutProps {
  children: ReactNode;
}
const Layout = ({ children }: LayoutProps) => {
  const { pathname, push } = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const { isConnected } = useBitkubNext();

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
                  href="/arttoy"
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
            <div className="navbar-end">
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
          {children}
          <FooterSection />
          <BottomNav />
        </div>
        <div className="drawer-side z-[10]">
          <label htmlFor="my-drawer-3" className="drawer-overlay"></label>
          <ul className="menu p-4 w-52 min-h-full bg-neutral text-thuiwhite rounded-tr-3xl shadow-2xl">
            <li>
              <Link href="/" className="flex">
                <img
                  className="w-[30px]"
                  src="images/thuiLogo.png"
                  alt="jaothui-logo"
                />
                <div className="font-bold text-lg">JAOTHUI</div>
              </Link>
            </li>
            <hr />
            <li>
              <Link href="/cert/profile" className="hover:text-primary">
                <AiFillCaretRight size={24} />
                <div>Profile</div>
              </Link>
            </li>
            <li>
              <Link
                href="/whitepaper.pdf"
                target="_blank"
                className="hover:text-primary"
              >
                <AiFillCaretRight size={24} />
                <div>Whitepaper</div>
              </Link>
            </li>
            <li>
              <Link
                href="https://www.bitkubnft.com/gashapon/427"
                target="_blank"
                className="hover:text-primary"
              >
                <AiFillCaretRight size={24} />
                <div>NFT Profile</div>
              </Link>
            </li>
            <li>
              <Link href="/cert" className="hover:text-primary">
                <AiFillCaretRight size={24} />
                <div>Pedigree List</div>
              </Link>
            </li>
            <li>
              <Link href="/partners" className="hover:text-primary">
                <AiFillCaretRight size={24} />
                <div>Partners</div>
              </Link>
            </li>
            <li>
              <Link
                href="https://kwaithai.com"
                target="_blank"
                className="hover:text-primary"
              >
                <AiFillCaretRight size={24} />
                <div>Kwaithai.com</div>
              </Link>
            </li>
            <li>
              {/* <LoginWithLineButton /> */}
              {isConnected ? (
                <BitkubDisconnectButton />
              ) : (
                <BitkubNextConnectButton />
              )}
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Layout;
