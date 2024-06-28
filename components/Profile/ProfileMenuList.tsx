import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaLine } from "react-icons/fa";
import { GiFarmTractor } from "react-icons/gi";
import { RiVipDiamondFill } from "react-icons/ri";

const ProfileMenuList = () => {
  return (
    <div className="grid grid-cols-4 gap-4 w-full p-2 rounded-xl">
      <Link
        href="https://line.me/R/ti/p/@551lwpun"
        className="grid grid-cols-1 place-items-center bg-neutral p-2 rounded-xl bg-opacity-30"
      >
        <FaLine size={28} />
        <span className="text-xs">Event</span>
      </Link>
      <Link
        href="https://kwaithai.com/"
        className="grid grid-cols-1 place-items-center bg-neutral p-2 rounded-xl bg-opacity-30"
      >
        {/* <FaLine size={28} /> */}
        <Image
          src="/images/logo.png"
          height={28}
          width={28}
          alt="kwaithai.com"
        />
        <span className="text-xs">Cert</span>
      </Link>
      <Link
        href="/cert/profile/privilege"
        className="grid grid-cols-1 place-items-center bg-neutral p-2 rounded-xl bg-opacity-30"
      >
        <RiVipDiamondFill size={28} />
        <span className="text-xs">Privilege</span>
      </Link>
      <Link
        href="/cert/profile/myfarm"
        className="grid grid-cols-1 place-items-center bg-neutral p-2 rounded-xl bg-opacity-30"
      >
        <GiFarmTractor size={28} />
        <span className="text-xs">My Farm</span>
      </Link>
    </div>
  );
};

export default ProfileMenuList;
