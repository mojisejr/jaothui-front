import GridItem from "../../GridItem";
import Link from "next/link";
import { FaSearch } from "react-icons/fa";
import { getMetadata } from "../../../helpers/getMetadata";

import { useGetInfosOf } from "../../../blockchain/cert/read";
import { useEffect, useState } from "react";
import { CertNFTRawData } from "../../../blockchain/cert/interface";
import { useCertContext } from "../../../hooks/cert/certContext";

export interface CollectionProps {
  address: `0x${string}` | undefined;
}

const Collection = ({ address }: CollectionProps) => {
  const { certNFTs } = useCertContext();
  const [buffaloList, setBuffaloList] = useState<CertNFTRawData[] | []>([]);

  useEffect(() => {
    getMetadata(certNFTs, setBuffaloList);
  }, [certNFTs]);

  return (
    <div id="profile-collection-box">
      <div
        id="profile-collection-header"
        className="
      tabletS:flex
      tabletS:justify-between
      tabletS:items-center"
      >
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
        tabletS:mt-3
        "
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
          {certNFTs && certNFTs.length <= 0 ? (
            <div className="text-xl text-thuiyellow">
              No certification found.
            </div>
          ) : (
            <>
              {buffaloList.map((data, index) => (
                <Link href={`/cert/${address}/${data.microchip}`} key={index}>
                  <GridItem
                    image={data.metadata!.image}
                    tokenName={data.name}
                    certNo={data.metadata!.attributes[2].value}
                    microcchip={data.microchip}
                  />
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;
