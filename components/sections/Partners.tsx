import Image from "next/image";

import bitkub from "../../public/images/bitkubLogo.png";

export default function PartnerSection() {
  return (
    <div
      className="relative w-full h-full top-[-90px] bg-thuigray pt-[7%] pb-[10%] pr-[5%] pl-[5%]
    tabletS:top-[-100px]
    tabletM:top-[-140px]
    labtop:top-[-160px]
    labtop:h-[calc(100% + 155px)]
    desktop:top-[-700px]"
    >
      <div>
        <div className="text-thuiwhite text-[35px]">Partners</div>
        <div className="flex justify-center">
          <div className="text-thuiwhite text-3xl">To be announcement</div>
          {/* <Image
            className="w-[300px]
            labtop:w-[500px]"
            src={bitkub}
            width={500}
            alt={"bitkub"}
          /> */}
        </div>
      </div>
    </div>
  );
}
