import { NextPage } from "next";

import Layout from "../../components/Layouts";
import PedigreeCard from "../../components/Shared/Card/PedigreeCard";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { IMetadata } from "../../interfaces/iMetadata";
import Loading from "../../components/Shared/Indicators/Loading";
import NotFound from "../../components/Shared/Utils/Notfound";
import { trpc } from "../../utils/trpc";
import { FiChevronsRight } from "react-icons/fi";
import { FiChevronsLeft } from "react-icons/fi";
import { useRouter } from "next/router";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import Link from "next/link";
import Image from "next/image";

type AgeOperator = ">" | "<" | ">=" | "<=" | "=";
type SortBy = "latest" | "oldest" | "youngest";

interface FilterParams {
  sex: "all" | "female" | "male";
  color: "all" | "black" | "albino";
  ageOperator: AgeOperator;
  ageValue: string;
  sortBy: SortBy;
  search: string;
}

interface RecentlyViewedItem {
  microchip: string;
  name: string;
  image?: string;
  timestamp: number;
}

const DEFAULT_FILTER_PARAMS: FilterParams = {
  sex: "all",
  color: "all",
  ageOperator: ">=",
  ageValue: "",
  sortBy: "latest",
  search: "",
};
const RECENTLY_VIEWED_KEY = "jaothui-cert-recently-viewed";
const RECENTLY_VIEWED_LIMIT = 8;

const CertMainPage: NextPage = () => {
  const { query } = useRouter();
  const { isConnected, walletAddress } = useBitkubNext();
  const [maxPage, setMaxPage] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [filterParams, setFilterParams] =
    useState<FilterParams>(DEFAULT_FILTER_PARAMS);
  const queryInput = {
    page,
    filter: {
      ...filterParams,
      ageValue: filterParams.ageValue.trim(),
      search: filterParams.search.trim(),
    },
  };
  const { data, isLoading } = trpc.metadata.getAll.useQuery(queryInput);
  const [currentData, setCurrentData] = useState<IMetadata[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const gotoPageRef = useRef<HTMLInputElement>(null);

  const { data: event, refetch: fetchEvent } =
    trpc.voteEvent.getVoteEventByUser.useQuery(
      { eventId: query.e! as string, wallet: walletAddress! },
      { enabled: false }
    );

  useEffect(() => {
    if (query.vote && isConnected && walletAddress) {
      fetchEvent();
    }
  }, [fetchEvent, isConnected, query.vote, walletAddress]);

  function updateFilterParams<K extends keyof FilterParams>(
    key: K,
    value: FilterParams[K]
  ) {
    setPage(1);
    setFilterParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleClearFilters() {
    setPage(1);
    setFilterParams(DEFAULT_FILTER_PARAMS);
  }

  function handlePedigreeOpen(metadata: IMetadata) {
    if (typeof window === "undefined") {
      return;
    }

    const nextItem: RecentlyViewedItem = {
      microchip: metadata.microchip,
      name: metadata.name,
      image: metadata.image,
      timestamp: Date.now(),
    };

    setRecentlyViewed((prev) => {
      const nextData = [
        nextItem,
        ...prev.filter((item) => item.microchip !== metadata.microchip),
      ].slice(0, RECENTLY_VIEWED_LIMIT);

      window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(nextData));
      return nextData;
    });
  }

  useEffect(() => {
    setMaxPage(Math.max(data?.totalPages || 0, 1));
  }, [data]);

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

  function handleGoToPage(e: SyntheticEvent) {
    e.preventDefault();
    const inputPage = parseInt(gotoPageRef.current?.value!);

    if (!inputPage) {
      alert("กรุณากรอกข้อมูลว่าจะไปที่หน้าไหน");
      return;
    }

    if (inputPage < 1 || inputPage > maxPage) {
      alert("ไม่มีหน้าที่ต้องการ");
      return;
    }

    if (typeof window != undefined) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setPage(inputPage);
  }

  useEffect(() => {
    if (data?.items && data.items.length > 0) {
      setCurrentData(data.items);
      return;
    }
    setCurrentData([]);
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedData = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!storedData) {
      return;
    }

    try {
      const parsedData = JSON.parse(storedData) as RecentlyViewedItem[];
      if (Array.isArray(parsedData)) {
        setRecentlyViewed(parsedData.slice(0, RECENTLY_VIEWED_LIMIT));
      }
    } catch {
      setRecentlyViewed([]);
    }
  }, []);

  return (
    <>
      <Layout>
        <div className="py-6">
          <div className="flex justify-between items-center px-[22px] py-2">
            <div className="text-xl font-bold">Pedigrees</div>
            <div className="text-sm font-semibold text-primary">
              Live: {currentData?.length || 0} / {data?.totalCount || 0}
            </div>
          </div>

          {recentlyViewed.length > 0 ? (
            <div className="px-[22px] mb-3">
              <div className="text-sm font-semibold mb-2">Recently Viewed</div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recentlyViewed.map((item) => (
                  <Link
                    key={item.microchip}
                    href={`/cert/${item.microchip}`}
                    className="flex-shrink-0 flex flex-col items-center gap-1"
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/10">
                      <Image
                        src={item.image || "images/thuiLogo.png"}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="text-xs max-w-[72px] text-center truncate">
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="px-[22px] py-2">
            <div
              id="search-bar"
              className="rounded-2xl backdrop-blur border border-white/10 p-3 grid grid-cols-1 gap-3 tabletS:grid-cols-2 desktopS:grid-cols-3"
            >
              <form className="flex items-center gap-2 flex-wrap">
                <div>Goto: </div>
                <input
                  type="number"
                  min={1}
                  max={maxPage}
                  required
                  ref={gotoPageRef}
                  className="input input-bordered w-18 input-sm tabletS:input-md"
                />
                <button
                  onClick={(e) => handleGoToPage(e)}
                  className="btn btn-primary btn-sm tabletS:btn-md"
                >
                  Go
                </button>
              </form>
              <label htmlFor="search" className="space-x-2 flex items-center">
                <span>Search:</span>
                <input
                  id="search"
                  type="text"
                  value={filterParams.search}
                  onChange={(e) => updateFilterParams("search", e.target.value)}
                  placeholder="Name / Microchip"
                  className="input input-bordered input-sm tabletS:input-md w-44"
                />
              </label>
              <label htmlFor="sort" className="space-x-2 flex items-center">
                <span>Sex:</span>
                <select
                  value={filterParams.sex}
                  onChange={(e) =>
                    updateFilterParams(
                      "sex",
                      e.target.value as FilterParams["sex"]
                    )
                  }
                  id="sort"
                  className="p-2 rounded-md tabletS:select-md select-sm"
                >
                  <option value="all">All</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>
              <label htmlFor="color" className="space-x-2 flex items-center">
                <span>Color:</span>
                <select
                  value={filterParams.color}
                  onChange={(e) =>
                    updateFilterParams(
                      "color",
                      e.target.value as FilterParams["color"]
                    )
                  }
                  id="color"
                  className="p-2 rounded-md tabletS:select-md select-sm"
                >
                  <option value="all">All</option>
                  <option value="black">ดำ</option>
                  <option value="albino">เผือก</option>
                </select>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <span>Age:</span>
                <select
                  value={filterParams.ageOperator}
                  onChange={(e) =>
                    updateFilterParams(
                      "ageOperator",
                      e.target.value as FilterParams["ageOperator"]
                    )
                  }
                  className="p-2 rounded-md tabletS:select-md select-sm"
                >
                  <option value=">">{`>`}</option>
                  <option value="<">{`<`}</option>
                  <option value=">=">{`>=`}</option>
                  <option value="<=">{`<=`}</option>
                  <option value="=">{`=`}</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={filterParams.ageValue}
                  onChange={(e) => updateFilterParams("ageValue", e.target.value)}
                  placeholder="months"
                  className="input input-bordered w-24 input-sm tabletS:input-md"
                />
              </div>
              <label htmlFor="sortBy" className="space-x-2 flex items-center">
                <span>Sort:</span>
                <select
                  value={filterParams.sortBy}
                  onChange={(e) =>
                    updateFilterParams(
                      "sortBy",
                      e.target.value as FilterParams["sortBy"]
                    )
                  }
                  id="sortBy"
                  className="p-2 rounded-md tabletS:select-md select-sm"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest First</option>
                  <option value="youngest">Youngest First</option>
                </select>
              </label>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-outline btn-sm tabletS:btn-md"
                >
                  Clear Filters
                </button>
              </div>
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
                      <PedigreeCard
                        key={index}
                        data={d}
                        vote={Boolean(query.vote)}
                        eventId={query.e as string}
                        canVote={event?.canVote!}
                        votedMicrochip={event?.votedMicrochip!}
                        index={(page - 1) * 30 + index + 1}
                        onOpen={handlePedigreeOpen}
                      />
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
            {page} of {maxPage}
          </div>
          <button
            disabled={page >= maxPage}
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
