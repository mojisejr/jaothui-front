import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layouts";
import { useRouter } from "next/router";
import Loading from "../../../components/Shared/Indicators/Loading";
import PedigreeCard from "../../../components/Shared/Card/PedigreeCard";
import { trpc } from "../../../utils/trpc";

const SearchResultPage = () => {
  const [found, setFound] = useState<any[]>();
  const { query } = useRouter();
  // const { data: allMetadata } = trpc.metadata.getAll.useQuery();

  // useEffect(() => {
  //   if (query.q != undefined && allMetadata != undefined) {
  //     handleSearchResult();
  //   }
  // }, [query, allMetadata]);

  const handleSearchResult = () => {
    // const keyword = query.q;
    // const found = allMetadata?.filter((buffalo) =>
    //   buffalo.name.includes(keyword as string)
    // );
    // setFound(found);
  };

  return (
    <Layout>
      <div className="w-full flex justify-center items-center flex-col mt-10">
        <div className="text-xl font-bold">ขออภัย !</div>
        <div className="text-xl font-bold text-center text-error">
          ปิดปรับปรุงระบบ ค้นหาด้วย ชื่อ และ คีย์เวิร์ด
        </div>
        <div>กรุณาค้นหาด้วย microchip เท่านั้น</div>
        <div className="text-xs">
          หากระบบกลับมาใช้งานได้ทีมงานจะแจ้งอีกครั้ง
        </div>
      </div>

      {/* {allMetadata == undefined || found == undefined ? (
        <div className="min-h-screen flex justify-center">
          <Loading size="lg" />
        </div>
      ) : (
        <>
          <div className="h-full grid grid-cols-1 place-items-center tabletS:grid-cols-2 tabletM:px-[10rem] labtop:grid-cols-3 desktopM:grid-cols-4 labtop:px-[13rem] desktopM:px-[18rem] gap-2 desktopM:gap-3 tabletS:px-10 px-2">
            {found.length > 0 ? (
              found.map((d, index) => <PedigreeCard key={index} data={d} />)
            ) : (
              <div className="min-h-screen flex justify-center">
                <Loading size="lg" />
              </div>
            )}
          </div>
        </>
      )} */}
    </Layout>
  );
};

export default SearchResultPage;
