import Link from "next/link";
import { AiFillHome } from "react-icons/ai";
import { BsFillCollectionFill } from "react-icons/bs";
import { GiFarmTractor } from "react-icons/gi";
import { MdAccountBox } from "react-icons/md";
import { useRouter } from "next/router";

const BottomNav = () => {
  const { pathname } = useRouter();

  return (
    <>
      <div className="btm-nav bg-neutral z-[10] tabletM:hidden">
        <Link href="/">
          <AiFillHome
            className={`text-base-200 hover:text-base-300
            ${pathname == "/" ? "text-primary" : null}
            `}
            size={24}
          />
        </Link>
        <Link href="/cert">
          <BsFillCollectionFill
            className={`text-base-200 hover:text-base-300 ${
              pathname == "/cert" ? "text-primary" : null
            }`}
            size={24}
          />
        </Link>
        <Link href="/">
          <img
            className="w-[50px]"
            src="/images/thuiLogo.png"
            alt="jaothui-logo"
          />
        </Link>
        <Link href="/cert/profile/myfarm">
          <GiFarmTractor
            className={`text-base-200 hover:text-base-300 ${
              pathname == "/cert/profile/myfarm" ? "text-primary" : null
            }`}
            size={30}
          />
        </Link>
        <Link href="/cert/profile">
          <MdAccountBox
            className={`text-base-200 hover:text-base-300 ${
              pathname == "/cert/profile" ? "text-primary" : null
            }`}
            size={24}
          />
        </Link>
      </div>
    </>
  );
};

export default BottomNav;
