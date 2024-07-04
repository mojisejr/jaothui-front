import React from "react";
import Link from "next/link";
import Image from "next/image";

const ProfileMenuList = () => {
  return (
    <div className="grid grid-cols-3 gap-4 w-full p-2 rounded-xl">
      <Link
        href="https://line.me/R/ti/p/@551lwpun"
        className="grid grid-cols-1 place-items-center bg-opacity-30 gap-1"
      >
        <figure className="w-24">
          <Image
            src="/images/icons/EVENT.png"
            height={1000}
            width={1000}
            alt="jaothui event"
          />
        </figure>
        <div className="flex flex-col items-center">
          <span className="text-xs">Event</span>
          <span className="text-[9px]">Jaothui Event</span>
        </div>
      </Link>
      <Link
        href="https://kwaithai.com/"
        className="grid grid-cols-1 place-items-center gap-1 rounded-xl bg-opacity-30"
      >
        <figure className="w-24">
          <Image
            src="/images/icons/KWAITHAI.png"
            height={1000}
            width={1000}
            alt="kwaithai.com"
          />
        </figure>
        <div className="flex flex-col items-center">
          <span className="text-xs">Cert</span>
          <span className="text-[9px]">Certificate</span>
        </div>
      </Link>
      <Link
        href="https://www.facebook.com/jaothui"
        target="_blank"
        className="grid grid-cols-1 place-items-center gap-1 rounded-xl bg-opacity-30"
      >
        <figure className="w-24">
          <Image
            src="/images/icons/FACEBOOK.png"
            height={1000}
            width={1000}
            alt="facebook"
          />
        </figure>
        <div className="flex flex-col items-center">
          <span className="text-xs">Facebook</span>
          <span className="text-[9px]">Fanpage</span>
        </div>
      </Link>

      <Link
        href="/cert/profile/myfarm"
        className="grid grid-cols-1 place-items-center gap-1 rounded-xl bg-opacity-30"
      >
        <figure className="w-24">
          <Image
            src="/images/icons/MY-FARM.png"
            height={1000}
            width={1000}
            alt="my farm"
          />
        </figure>
        <div className="flex flex-col items-center">
          <span className="text-xs">My Farm</span>
          <span className="text-[9px]">Farm Management</span>
        </div>
      </Link>

      <Link
        href="/cert/profile/privilege"
        className="grid grid-cols-1 place-items-center gap-1 rounded-xl bg-opacity-30"
      >
        <figure className="w-24">
          <Image
            src="/images/icons/PRIVILEGE.png"
            height={1000}
            width={1000}
            alt="privilege"
          />
        </figure>
        <div className="flex flex-col items-center">
          <span className="text-xs">Previlege</span>
          <span className="text-[9px]">Reward & Redeem</span>
        </div>
      </Link>

      <Link
        href="#"
        className="grid grid-cols-1 place-items-center gap-1 rounded-xl bg-opacity-30"
      >
        <figure className="w-24">
          <Image
            src="/images/icons/SHOP.png"
            height={1000}
            width={1000}
            alt="facebook"
          />
        </figure>
        <div className="flex flex-col items-center">
          <span className="text-xs">SHOP</span>
          <span className="text-[9px]">coming soon</span>
        </div>
      </Link>
    </div>
  );
};

export default ProfileMenuList;
