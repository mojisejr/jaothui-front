import React from "react";
import Image from "next/image";

function SummitLogo() {
  return (
    <div className="flex gap-2">
      <figure className="w-20">
        <Image
          src="/images/logo.png"
          width={512}
          height={512}
          alt="logo"
        ></Image>
      </figure>
      <div>
        <div className="px-2  border-l-2 border-thuiwhite">
          <div>
            <h1 className="font-bold text-xl text-[#00d00f]">BUFFALO</h1>
            <h1 className="font-bold text-xl text-thuiwhite">SUMMIT 2025</h1>
          </div>
          <span className="text-sm text-thuiwhite">ROAD TO THE FUTURE</span>
        </div>
        <p className="text-[10px] px-2.5">
          <span className="text-thuiwhite">powered by</span>{" "}
          <span className="text-thuiyellow">JAOTHUI</span>
        </p>
      </div>
    </div>
  );
}

export default SummitLogo;
