import Link from "next/link";
import { useGetAllMetadata } from "../../../blockchain/Metadata/read";
import PedigreeCard from "../../Shared/Card/PedigreeCard";
import _ from "lodash";
import { trpc } from "../../../utils/trpc";
import { useEffect, useState } from "react";
import { IMetadata } from "../../../interfaces/iMetadata";
import Loading from "../../Shared/Indicators/Loading";

const Pedigree = () => {
  const [data, setData] = useState<IMetadata[]>([]);
  const { data: allMetadata, isLoading } = trpc.metadata.getAll.useQuery();
  // const { allMetadata } = useGetAllMetadata();
  // const data = allMetadata

  //   ? [allMetadata[0], allMetadata[1], allMetadata[2], allMetadata[3]]
  //   : [];

  // const data = _.take(allMetadata, 8);

  useEffect(() => {
    if (allMetadata != undefined) {
      const data = [
        allMetadata![8],
        allMetadata![70],
        allMetadata![79],
        allMetadata![81],
        allMetadata![72],
        allMetadata![76],
        allMetadata![155],
        allMetadata![65],
      ];

      setData(data);
    }
  }, [allMetadata, isLoading]);

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
          <div className="grid grid-cols-1 place-items-center tabletS:grid-cols-2 tabletM:grid-cols-4 desktopM:grid-cols-4 px-2 tabletS:px-10 gap-2 labtop:gap-4">
            {data
              ? data.map((d, index) => <PedigreeCard key={index} data={d} />)
              : "ไม่มีข้อมูล"}
          </div>
        ) : (
          <div className="grid grid-cols-1 place-items-center tabletS:grid-cols-2 tabletM:grid-cols-4 desktopM:grid-cols-4 px-2 tabletS:px-10 gap-2 labtop:gap-4 h-[300px]">
            <Loading size="lg" />
          </div>
        )}
      </div>
    </>
  );
};

export default Pedigree;
