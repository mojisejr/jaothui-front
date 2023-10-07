import Image from "next/image";
import thui from "../public/images/First1.png";

import { FiSearch } from "react-icons/fi";

import { SyntheticEvent, useRef } from "react";
import { useRouter } from "next/router";

const BuyBox = () => {
  const searchRef = useRef<HTMLInputElement>(null);
  const { push } = useRouter();

  function handleSearch(e: SyntheticEvent) {
    const value =
      searchRef.current?.value == undefined ? "" : searchRef.current.value;

    if (value == "") {
      return;
    }

    push(`/cert/${value}`);
  }

  return (
    <div
      className="relative p-5 flex flex-col items-center
    tabletS:right-[-14%]
    tabletS:top-[25%]
    tabletS:w-full
    tabletM:right-[-30%]
    labtop:top-[30%]
    labtop:right-[-25%]
    "
    >
      <Image
        className="w-[300px]
      tabletS:absolute
      tabletS:top-[-40%]
      tabletS:left-[-33%]
      tabletS:w-[400px]
      tabletM:top-[-60%]
      tabletM:left-[-70%]
      tabletM:w-[580px]
      labtop:top-[-80%]
      labtop:left-[-60%]
      labtop:w-[650px]
      "
        src={thui}
        width={400}
        alt="thui image"
      />
      <div className="text-thuiwhite">
        <div
          className="text-[20px]
        tabletS:text-[25px]
        tabletM:text-[30px]
        labtop:text-[45px]
        "
        >
          NFTPEDIGREE ใบพันธุ์ประวัติที่นำนวัตกรรม
        </div>
        <div
          className="text-[20px]
        tabletS:text-[20px]
        tabletM:text-[25px]
        labtop:text-[30px]"
        >
          เทคโนโลยีบล๊อกเชนในการยกระดับการเก็บข้อมูล
        </div>
      </div>
      <div
        className="flex rounded-[50px] p-3 bg-thuiwhite border-[2px] mt-3 
      tabletS:text-[25px]
      "
      >
        <input
          className="text-thuidark pl-2 pr-2 pt-1 pb-1 rounded-[50px] outline-none bg-thuiwhite placeholder:text-thuidark placeholder:text-opacity-80"
          type="text"
          minLength={15}
          maxLength={15}
          required
          placeholder="microchip Id (15 digits)"
          ref={searchRef}
        ></input>
        <button
          className="hover:text-thuiyellow text-thuidark pr-2"
          onClick={(e) => handleSearch(e)}
        >
          <FiSearch size={30} />
        </button>
      </div>
    </div>
  );
};

export default BuyBox;
