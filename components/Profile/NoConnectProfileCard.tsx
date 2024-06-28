import React from "react";
import BitkubNextConnectButton from "../Shared/BitkubNext";
import Image from "next/image";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import BitkubDisconnectButton from "../Shared/BitkubNextDiscon";

const NoConnectProfileCard = () => {
  const { isConnected } = useBitkubNext();
  return (
    <div className="relative card glass bg-primary w-84 p-4 min-h-[200px]">
      <div className="grid grid-cols-6 w-full h-full">
        <div className="col-span-4">
          <div className="p-2">ยินดีต้อนรับเข้าสู่ Jaothui platform</div>
        </div>
        <div className="col-span-2">
          <Image
            src="/images/thuiLogo.png"
            width={200}
            height={200}
            alt="logo"
          />
        </div>
        <div className="col-span-4"></div>
        <div className="col-span-2 flex justify-center items-center">
          {isConnected ? (
            <BitkubDisconnectButton />
          ) : (
            <BitkubNextConnectButton />
          )}
        </div>
      </div>
    </div>
  );
};

export default NoConnectProfileCard;
