import BuyBox from "../BuyBox";
import Title from "../Title";
import Image from "next/image";
import first from "../../public/images/First1.png";

export default function FirstSection() {
  return (
    <div className="relative w-full h-screen bg-thuiyellow flex justify-center z-50">
      <div className="mt-[10%]">
        <Title />
        <BuyBox />
      </div>
      <div className="absolute bottom-[-40%] left-0 z-40">
        <Image src={first} width={1000} alt={"main"} />
      </div>
    </div>
  );
}
