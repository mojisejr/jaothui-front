import { FunctionComponent, PropsWithChildren } from "react";
import Link from "next/link";

const ProfileMenu = () => {
  return (
    <div className="flex flex-col justify-center items-center text-thuiwhite">
      <div className="text-xl">Menu</div>
      <ul className="flex flex-col justify-center items-center text-2xl mt-4 gap-3 w-full text-center">
        <li
          className="p-5 bg-[url('/images/banner1.png')] w-full bg-cover rounded-md
          hover:shadow-xl"
        >
          <Link href="/cert/profile/mycert">MY PEDIGREES</Link>
        </li>
        <li
          className="p-5 bg-[url('/images/banner2.png')] w-full bg-cover rounded-md 
          hover:shadow-xl"
        >
          <Link href="#">JAOTHUI NFT PRIVILEGE</Link>
        </li>
        <li
          className="p-5 bg-[url('/images/banner3.png')] w-full bg-cover rounded-md
          hover:shadow-xl"
        >
          <Link href="/cert/profile/myfarm">MY FARM</Link>
          {/* <Link href="/cert/profile/myfarm">MY FARM</Link> */}
        </li>
      </ul>
    </div>
  );
};

export default ProfileMenu;
