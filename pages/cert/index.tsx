import { NextPage } from "next";

import Layout from "../../components/Layouts";
import PedigreeCard from "../../components/Shared/Card/PedigreeCard";
import { SyntheticEvent, useEffect, useState } from "react";
import { IMetadata } from "../../interfaces/iMetadata";
import Loading from "../../components/Shared/Indicators/Loading";
import NotFound from "../../components/Shared/Utils/Notfound";
import { trpc } from "../../utils/trpc";
import { FiChevronsRight } from "react-icons/fi";
import { FiChevronsLeft } from "react-icons/fi";

const CertMainPage: NextPage = () => {
  const [maxPage, setMaxPage] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const { data: totalSupply } = trpc.metadata.totalSupply.useQuery();
  const { data, isLoading, refetch } = trpc.metadata.getAll.useQuery(page);
  const [sortState, setSortState] = useState<number>(0);
  const [currentData, setCurrentData] = useState<IMetadata[]>(data!);

  function handleSorting(e: SyntheticEvent) {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      value: number;
    };

    switch (+target.value) {
      case 1: {
        const sorted = data!.filter((f) => f.sex == "Female");
        setCurrentData(sorted);
        break;
      }
      case 2: {
        const sorted = data!.filter((f) => f.sex == "Male");
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
    refetch();
  }, [page]);

  useEffect(() => {
    setMaxPage(Math.floor(totalSupply! / 30));
  }, [totalSupply]);

  function handleNextPage() {
    if (typeof window != undefined) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setPage(page + 1);
  }

  function handlePrevPage() {
    if (page <= 1) return;
    if (typeof window != undefined) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setPage(page - 1);
  }

  useEffect(() => {
    if (data && data!.length > 0 && sortState == 0) {
      setCurrentData(data!);
    }
  }, [data, sortState]);

  return (
    <>
      <Layout>
        <div className="py-6">
          <div className="flex justify-between items-center px-[22px] py-2">
            <div className="text-xl font-bold">Pedigrees</div>
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
          {isLoading || currentData == undefined ? (
            <div className="h-screen flex w-full justify-center items-start">
              <Loading size="lg" />
            </div>
          ) : (
            <>
              {currentData.length <= 0 ? (
                <NotFound />
              ) : (
                <div className="grid grid-cols-1 place-items-center tabletS:grid-cols-2 tabletM:px-[10rem] labtop:grid-cols-3 desktopM:grid-cols-4 labtop:px-[13rem] desktopM:px-[18rem] gap-2 desktopM:gap-3 tabletS:px-10 px-2">
                  {currentData ? (
                    currentData.map((d, index) => (
                      <PedigreeCard key={index} data={d} />
                    ))
                  ) : (
                    <Loading size="lg" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="w-full flex justify-center gap-10 mb-10 items-center">
          <button
            disabled={page <= 1}
            className="btn btn-primary"
            onClick={() => handlePrevPage()}
          >
            <FiChevronsLeft size={24} />
            Prev
          </button>
          <div className="font-bold">
            {page} of {maxPage + 1}
          </div>
          <button
            disabled={maxPage < page}
            className="btn btn-primary"
            onClick={() => handleNextPage()}
          >
            NEXT
            <FiChevronsRight size={24} />
          </button>
        </div>
      </Layout>
    </>
  );
};

export default CertMainPage;
