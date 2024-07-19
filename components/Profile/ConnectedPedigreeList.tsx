import Link from "next/link";
import _ from "lodash";
import PedigreeSmallCard from "./PedigreeSmallCard";
import { trpc } from "../../utils/trpc";
import Loading from "../Shared/Indicators/Loading";
import { useBitkubNext } from "../../contexts/bitkubNextContext";

const ConnectedPedigreeList = () => {
  const { walletAddress } = useBitkubNext();
  const { data, isLoading } = trpc.user.kGetMember.useQuery({
    wallet: walletAddress!,
  });

  if (!data) {
    return (
      <div className="py-6">
        <div className="flex justify-between items-center px-[22px] py-2">
          <div className="text-xl font-bold">Pedigrees</div>
          <Link href="/cert" className="text-sm">
            ดูทั้งหมด{">"}
          </Link>
        </div>
        <div className="carousel carousel-center bg-transparent rounded-box w-full space-x-2 p-2">
          ไม่มีข้อมูล
        </div>
      </div>
    );
  }

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
            {data && data.Certificate.length > 0
              ? data.Certificate.map((d, index) => (
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

export default ConnectedPedigreeList;
