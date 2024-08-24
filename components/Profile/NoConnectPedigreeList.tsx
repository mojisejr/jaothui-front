import Link from "next/link";
import { useGetAllMetadata } from "../../blockchain/Metadata/read";
import PedigreeCard from "../Shared/Card/PedigreeCard";
import _ from "lodash";
import PedigreeSmallCard from "./PedigreeSmallCard";
import { useEffect, useState } from "react";
import { IMetadata } from "../../interfaces/iMetadata";
import { trpc } from "../../utils/trpc";
import Loading from "../Shared/Indicators/Loading";

const NoConnectPedigreeList = () => {
  const { data, isLoading } = trpc.metadata.getBatch.useQuery([
    "764040226300035",
    "764040226600001",
    "933004022017321",
    "900115003414178",
    "900115003414472",
    "764040226600008",
    "900115003739216",
    "764040226301331",
  ]);
  // const { allMetadata } = useGetAllMetadata();
  // const data = allMetadata

  //   ? [allMetadata[0], allMetadata[1], allMetadata[2], allMetadata[3]]
  //   : [];

  // const data = _.take(allMetadata, 8);

  return (
    <>
      <div className="py-6">
        <div className="flex justify-between items-center px-[22px] py-2">
          <div className="text-xl font-bold">Pedigrees</div>
          <Link href="/cert" className="text-sm">
            ดูทั้งหมด{">"}
          </Link>
        </div>
        {!isLoading ? (
          <div className="carousel carousel-center bg-transparent rounded-box w-full space-x-2 p-2">
            {data
              ? data.map((d, index) => (
                  <div key={index} className="carousel-item">
                    <PedigreeSmallCard key={index} data={d} />
                  </div>
                ))
              : "ไม่มีข้อมูล"}
          </div>
        ) : (
          <div className="grid grid-cols-1 place-items-center tabletS:grid-cols-2 tabletM:grid-cols-4 desktopM:grid-cols-4 px-2 tabletS:px-10 gap-2 labtop:gap-4 h-[300px]">
            <Loading size="lg" />
          </div>
        )}
        {/* <div className="grid grid-cols-1 place-items-center tabletS:grid-cols-2 tabletM:grid-cols-4 desktopM:grid-cols-4 px-2 tabletS:px-10 gap-2 labtop:gap-4">
          {data
            ? data.map((d, index) => <PedigreeCard key={index} data={d} />)
            : "Nothing to show"}
        </div> */}
      </div>
    </>
  );
};

export default NoConnectPedigreeList;
