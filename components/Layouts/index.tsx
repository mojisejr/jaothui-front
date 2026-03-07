import { ReactNode } from "react";
import BottomNav from "../Shared/Navbar/Bottom";
import { HiMenuAlt2 } from "react-icons/hi";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import MenuList from "../Shared/Navbar/MenuList";
import GlobalNavSearch from "../Shared/Navbar/GlobalNavSearch";

interface LayoutProps {
  children: ReactNode;
}
const Layout = ({ children }: LayoutProps) => {
  const router = useRouter();

  // Condition to hide global search: Home or exactly /cert (Landing)
  const hideSearch =
    router.pathname === "/" ||
    (router.pathname === "/cert" && router.asPath === "/cert");

  return (
    <>
      <div className="drawer">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Navbar */}
          <div className="navbar sticky left-0 top-0 z-30 border-b border-base-300 bg-thuiwhite/95 px-[22px] backdrop-blur-sm">
            <div className="navbar-start flex items-center gap-2">
              <label
                htmlFor="my-drawer-3"
                className="btn btn-square btn-ghost hidden tabletM:inline-flex"
                aria-label="Open navigation menu"
              >
                <HiMenuAlt2 size={24} />
              </label>
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/thuiLogo.png"
                  width={28}
                  height={28}
                  alt="jaothui-logo"
                />
                <span className="font-bold text-sm text-thuidark">JAOTHUI</span>
              </Link>
            </div>

            <div className="navbar-end">
              {!hideSearch && <GlobalNavSearch />}
            </div>
          </div>
          <div className="mb-10">{children}</div>
          {/* <FooterSection /> */}
          <BottomNav />
        </div>
        <MenuList />
      </div>
    </>
  );
};

export default Layout;
