import Link from "next/link";
import { FaHome } from "react-icons/fa";
// import { MdAccountBox } from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import { useRouter } from "next/router";

const BottomNav = () => {
  const { pathname } = useRouter();

  return (
    <>
      <div className="btm-nav bg-neutral z-[10] tabletM:hidden rounded-tr-xl rounded-tl-xl">
        <Link href="/">
          <div className="flex flex-col justify-center items-center">
            <FaHome
              className={`text-base-200 hover:text-base-300 ${
                pathname == "/" ? "text-primary" : null
              }`}
              size={32}
            />
            <span
              className={`text-xs ${pathname == "/" ? "text-primary" : "text-thuiwhite"}`}
            >
              หน้าหลัก
            </span>
          </div>
        </Link>

        <div></div>
        <Link
          className="absolute bottom-5 bg-secondary rounded-full p-2 shadow-sm"
          href="/cert"
        >
          <img
            className="mt-2 w-[50px]"
            src="/images/thuiLogo.png"
            alt="jaothui-logo"
          />
        </Link>
        <Link href="/profile">
          <div className="flex flex-col justify-center items-center">
            <MdAccountCircle
              className={`text-base-200 hover:text-base-300 ${
                pathname == "/profile" ? "text-primary" : null
              }`}
              size={32}
            />
            <span
              className={`text-xs ${pathname == "/profile" ? "text-primary" : "text-thuiwhite"}`}
            >
              โปรไฟล์
            </span>
          </div>
        </Link>
      </div>
    </>
  );
};

export default BottomNav;
