import Image from "next/image";

import bitkub from "../../public/images/bitkubLogo.png";

export default function PartnerSection() {
  return (
    <div className="w-full h-full bg-thuigray pt-[3%] pb-[3%] pr-[5%] pl-[5%]">
      <div>
        <div className="text-thuiwhite text-[45px]">Partners</div>
        <div className="flex justify-center">
          <Image src={bitkub} width={500} alt={"bitkub"} />
        </div>
      </div>
    </div>
  );
}
