import Image from "next/image";

import bitkub from "../../public/images/bitkubLogo.png";

export default function PartnerSection() {
  return (
    <div
      className="relative w-full h-full top-[-170px] bg-thuigray pt-[3%] pb-[3%] pr-[5%] pl-[5%]
    tabletS:top-[-300px]
    tabletM:top-[-400px]
    labtop:top-[-550px]
    desktop:top-[-700px]"
    >
      <div>
        <div className="text-thuiwhite text-[35px]">Partners</div>
        <div className="flex justify-center">
          <Image
            className="w-[300px]
            labtop:w-[500px]"
            src={bitkub}
            width={500}
            alt={"bitkub"}
          />
        </div>
      </div>
    </div>
  );
}
