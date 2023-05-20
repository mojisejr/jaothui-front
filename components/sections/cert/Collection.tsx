import GridItem from "../../GridItem";
import Link from "next/link";

import { SyntheticEvent, useEffect, useState } from "react";
import { useGetMetadataOf } from "../../../blockchain/Metadata/read";
import { IMetadata } from "../../../interfaces/iMetadata";

export interface CollectionProps {
  address: `0x${string}` | "" | undefined;
}

const Collection = ({ address }: CollectionProps) => {
  // const { certNFTs, refetchCert } = useCertContext();
  const { metadataOfOwner } = useGetMetadataOf();
  const [sortState, setSortState] = useState<number>(0);
  const [currentData, setCurrentData] = useState<IMetadata[]>(metadataOfOwner);
  //@TODO: sort by all, male, female

  function handleSorting(e: SyntheticEvent) {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      value: number;
    };

    switch (+target.value) {
      case 1: {
        const sorted = metadataOfOwner.filter((f) => f.sex == "female");
        console.log(sorted);
        setCurrentData(sorted);
        break;
      }
      case 2: {
        const sorted = metadataOfOwner.filter((f) => f.sex == "male");
        setCurrentData(sorted);
        break;
      }
      default: {
        break;
      }
    }
    setSortState(target.value);
  }

  useEffect(() => {
    if (metadataOfOwner.length > 0 && sortState == 0) {
      setCurrentData(metadataOfOwner);
    }
  }, [metadataOfOwner, sortState]);

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
          My Pedigrees
        </div>
        <div
          id="search-bar"
          className="flex items-center gap-3 mt-1 mb-1
        tabletS:mt-3
        "
        >
          <label htmlFor="sort" className="space-x-2">
            <span className="text-thuiwhite">sortBy:</span>
            <select
              onChange={(e) => handleSorting(e)}
              id="sort"
              className="p-2 rounded-md"
            >
              <option value={0}>All</option>
              <option value={1}>Female</option>
              <option value={2}>Male</option>
            </select>
          </label>
        </div>
      </div>
      <div id="grid" className="mt-3 p-3">
        <div
          className="grid grid-cols-1 gap-4
        tabletM:grid-cols-3"
        >
          {metadataOfOwner && metadataOfOwner.length <= 0 ? (
            <div className="text-xl text-thuiyellow">Loading..</div>
          ) : (
            <>
              {currentData.length <= 0 ? (
                <div className="text-xl text-thuiyellow">Loading...</div>
              ) : (
                currentData.map((data, index) => (
                  <Link href={`/cert/${data.microchip}`} key={index}>
                    <GridItem
                      image={data.image!}
                      tokenName={data.name}
                      certNo={data.certNo}
                      microcchip={data.microchip}
                      sex={data.sex}
                    />
                  </Link>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;
