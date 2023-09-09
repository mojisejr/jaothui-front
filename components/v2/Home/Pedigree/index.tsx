import Link from "next/link";
import { useGetAllMetadata } from "../../../../blockchain/Metadata/read";
import PedigreeCard from "../../Shared/Card/PedigreeCard";

const Pedigree = () => {
  const { allMetadata } = useGetAllMetadata();
  const data = allMetadata
    ? [allMetadata[0], allMetadata[1], allMetadata[2], allMetadata[3]]
    : [];
  return (
    <>
      <div className="py-6">
        <div className="flex justify-between items-center px-[22px] py-2">
          <div className="text-xl font-bold">Pedigrees</div>
          <Link href="/cert" className="text-sm">
            ดูทั้งหมด{">"}
          </Link>
        </div>
        <div className="grid grid-cols-1 place-items-center tabletS:grid-cols-2 labtop:grid-cols-3 desktopM:grid-cols-4">
          {data
            ? data.map((d, index) => <PedigreeCard key={index} data={d} />)
            : "Nothing to show"}
        </div>
      </div>
    </>
  );
};

export default Pedigree;
