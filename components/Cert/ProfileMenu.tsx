import Link from "next/link";
import { toast } from "react-toastify";

const ProfileMenu = () => {
  return (
    <div className="flex flex-col justify-center items-center text-thuiwhite py-2">
      <div className="text-xl font-bold text-neutral">Menu</div>
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
          <Link href="#" onClick={() => toast.success("Coming Soon!!")}>
            JAOTHUI NFT PRIVILEGE
          </Link>
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
