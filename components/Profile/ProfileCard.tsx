import React from "react";
import BitkubNextConnectButton from "../Shared/BitkubNext";
import Image from "next/image";
import { Member } from "../../interfaces/Profile/Member";
import BitkubDisconnectButton from "../Shared/BitkubNextDiscon";

interface ProfileCardProps {
  member: Member;
}

const ProfileCard = ({ member }: ProfileCardProps) => (
  <div className="relative card glass bg-primary w-84 p-4 min-h-[200px]">
    <div className="absolute -right-3 top-3 z-[-1] opacity-40">
      <Image src="/images/thuiLogo.png" width={200} height={200} alt="logo" />
    </div>
    <div className="grid grid-cols-6 w-full h-full">
      <div className="col-span-4">
        <div className="p-2 grid grid-cols-1 gap-1">
          {member.name}
          <span className="text-xs font-semibold">
            {`${member.wallet.slice(0, 6)}...${member.wallet.slice(38)}`}
          </span>
        </div>
      </div>
      <div className="col-span-2">
        <div className="avatar">
          <div className="ring-[#eee] ring-offset-primary w-24 rounded-full ring ring-offset-1">
            <Image
              src={
                member.avatar == undefined
                  ? "/images/thuiLogo.png"
                  : member.avatar
              }
              width={1000}
              height={700}
              alt={member.name}
            />
          </div>
        </div>
      </div>
      <div className="col-span-4 p-2">
        <div>จำนวนควาย</div>
        <div>N/A</div>
      </div>
      <div className="col-span-2 flex justify-center items-center my-2">
        <BitkubDisconnectButton />
      </div>
    </div>
  </div>
);

export default ProfileCard;
