import GridItem from "../../GridItem";
import Link from "next/link";
import { FaSearch } from "react-icons/fa";

import thui from "../../../public/images/N.jpg";
import thui2 from "../../../public/images/R.png";
import thui3 from "../../../public/images/SR.jpg";

export interface CollectionProps {
  address: `0x${string}` | undefined;
}

const Collection = ({ address }: CollectionProps) => {
  const mockData = [
    {
      tokenName: "บ่าวจอนสัน",
      certNo: "อด13/66",
      microcchip: "764040226302396",
    },
    {
      tokenName: "บ่าวจอนนี่",
      certNo: "หค15/88",
      microcchip: "884040226302396",
    },
    {
      tokenName: "บ่าวจอนจัด",
      certNo: "จบ99/999",
      microcchip: "124040226302396",
    },
  ];

  return (
    <div id="profile-collection-box">
      <div id="profile-collection-header" className="">
        <div
          id="header-title"
          className="text-thuiwhite text-xl
          tabletS:text-2xl
          tabletM:text-3xl
        "
        >
          Collection
        </div>
        <div
          id="search-bar"
          className="flex items-center gap-3 mt-1 mb-1
        tabletS:mt-3"
        >
          <input
            className="flex-1 rounded-md text-center
          tabletS:text-xl"
            type="text"
          ></input>
          <button className="flex-none text-thuiwhite">
            <FaSearch size={20} />
          </button>
        </div>
      </div>
      <div id="grid" className="mt-3 p-3">
        <div
          className="grid grid-cols-1 gap-4
        tabletM:grid-cols-3"
        >
          <Link href={`/cert/${address}/${mockData[0].microcchip}`}>
            <GridItem
              image={thui}
              tokenName={mockData[0].tokenName}
              certNo={mockData[0].certNo}
              microcchip={mockData[0].microcchip}
            />
          </Link>

          <Link href={`/cert/${address}/${mockData[1].microcchip}`}>
            <GridItem
              image={thui2}
              tokenName={mockData[1].tokenName}
              certNo={mockData[1].certNo}
              microcchip={mockData[1].microcchip}
            />
          </Link>
          <Link href={`/cert/${address}/${mockData[2].microcchip}`}>
            <GridItem
              image={thui3}
              tokenName={mockData[2].tokenName}
              certNo={mockData[2].certNo}
              microcchip={mockData[2].microcchip}
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Collection;
