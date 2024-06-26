import React, { useEffect, useState } from "react";
import Layout from "../../../components/Layouts";
import { useRouter } from "next/router";
import { useGetAllMetadata } from "../../../blockchain/Metadata/read";
import Loading from "../../../components/Shared/Indicators/Loading";
import PedigreeCard from "../../../components/Shared/Card/PedigreeCard";
import NotFound from "../../../components/Shared/Utils/Notfound";
import { trpc } from "../../../utils/trpc";

const SearchResultPage = () => {
  const [found, setFound] = useState<any[]>();
  const { query } = useRouter();
  // const { allMetadata } = useGetAllMetadata();
  const { data: allMetadata } = trpc.metadata.getAll.useQuery();

  useEffect(() => {
    if (query.q != undefined && allMetadata != undefined) {
      handleSearchResult();
    }
  }, [query, allMetadata]);

  const handleSearchResult = () => {
    const keyword = query.q;
    const found = allMetadata?.filter((buffalo) =>
      buffalo.name.includes(keyword as string)
    );
    setFound(found);
  };

  return (
    <Layout>
      {allMetadata == undefined || found == undefined ? (
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
      )}
    </Layout>
  );
};

export default SearchResultPage;
