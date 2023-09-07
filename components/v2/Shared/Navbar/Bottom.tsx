import Link from "next/link";
import { AiFillHome } from "react-icons/ai";
import { BsFillCollectionFill } from "react-icons/bs";
import { GiFarmTractor } from "react-icons/gi";
import { MdAccountBox } from "react-icons/md";

const BottomNav = () => {
  return (
    <>
      <div className="btm-nav bg-neutral">
        <Link href="/">
          <AiFillHome className="text-base-200 hover:text-base-300" size={24} />
        </Link>
        <Link href="/cert">
          <BsFillCollectionFill
            className="text-base-200 hover:text-base-300"
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
            className="text-base-200 hover:text-base-300"
            size={30}
          />
        </Link>
        <Link href="/cert/profile">
          <MdAccountBox
            className="text-base-200 hover:text-base-300"
            size={24}
          />
        </Link>
      </div>
    </>
  );
};

export default BottomNav;
