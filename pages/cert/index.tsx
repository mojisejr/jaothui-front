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

const DEFAULT_FILTER_PARAMS: FilterParams = {
  sex: "all",
  color: "all",
  ageOperator: ">=",
  ageValue: "",
  sortBy: "latest",
  search: "",
};

const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeColor(color: string) {
  const normalized = color.toLowerCase().trim();
  if (normalized.includes("เผือก") || normalized.includes("albino")) {
    return "albino";
  }
  if (normalized.includes("ดำ") || normalized.includes("black")) {
    return "black";
  }
  return "other";
}

function calculateAgeInMonths(metadata: IMetadata) {
  if (metadata.calculatedAge && metadata.calculatedAge > 0) {
    return metadata.calculatedAge;
  }
  if (!metadata.birthdate) {
    return 0;
  }

  const birthTimestamp = Number(metadata.birthdate);
  const nowTimestamp = Date.now();

  if (!birthTimestamp || birthTimestamp > nowTimestamp) {
    return 0;
  }

  return Math.floor((nowTimestamp - birthTimestamp) / MONTH_IN_MS);
}

function compareAgeWithOperator(
  currentAge: number,
  targetAge: number,
  operator: AgeOperator
) {
  switch (operator) {
    case ">":
      return currentAge > targetAge;
    case "<":
      return currentAge < targetAge;
    case ">=":
      return currentAge >= targetAge;
    case "<=":
      return currentAge <= targetAge;
    case "=":
      return currentAge === targetAge;
    default:
      return true;
  }
}

function applyFiltersAndSort(data: IMetadata[], filterParams: FilterParams) {
  const targetAge = Number(filterParams.ageValue);
  const hasAgeFilter =
    filterParams.ageValue.trim().length > 0 && Number.isFinite(targetAge);

  const filteredData = data.filter((item) => {
    const sex = item.sex.toLowerCase();
    const itemColor = normalizeColor(item.color);

    const matchedSex =
      filterParams.sex === "all" ||
      (filterParams.sex === "female" && sex === "female") ||
      (filterParams.sex === "male" && sex === "male");

    const matchedColor =
      filterParams.color === "all" || filterParams.color === itemColor;

    const matchedAge =
      !hasAgeFilter ||
      compareAgeWithOperator(
        calculateAgeInMonths(item),
        targetAge,
        filterParams.ageOperator
      );

    return matchedSex && matchedColor && matchedAge;
  });

  return [...filteredData].sort((a, b) => {
    const aBirthdate = Number(a.birthdate) || 0;
    const bBirthdate = Number(b.birthdate) || 0;
    const aAge = calculateAgeInMonths(a);
    const bAge = calculateAgeInMonths(b);

    if (filterParams.sortBy === "oldest") {
      if (aAge === bAge) {
        return aBirthdate - bBirthdate;
      }
      return bAge - aAge;
    }

    if (filterParams.sortBy === "youngest") {
      if (aAge === bAge) {
        return bBirthdate - aBirthdate;
      }
      return aAge - bAge;
    }

    const aTokenId = a.tokenId || 0;
    const bTokenId = b.tokenId || 0;
    if (aTokenId !== bTokenId) {
      return bTokenId - aTokenId;
    }
    return bBirthdate - aBirthdate;
  });
}

const CertMainPage: NextPage = () => {
  const { query } = useRouter();
  const { isConnected, walletAddress } = useBitkubNext();
  const [maxPage, setMaxPage] = useState<number>(100); // Default max page
  const [page, setPage] = useState<number>(1);
  const { data, isLoading, refetch } = trpc.metadata.getAll.useQuery(page);
  const [filterParams, setFilterParams] =
    useState<FilterParams>(DEFAULT_FILTER_PARAMS);
  const [currentData, setCurrentData] = useState<IMetadata[]>(data!);
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
  }, [event, isConnected, walletAddress]);

  function updateFilterParams<K extends keyof FilterParams>(
    key: K,
    value: FilterParams[K]
  ) {
    setFilterParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  useEffect(() => {
    refetch();
  }, [page]);

  useEffect(() => {
    // Update max page based on data availability
    // If we get less than 30 items, we've reached the end
    if (data && data.length < 30 && data.length > 0) {
      setMaxPage(page);
    }
  }, [data, page]);

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

    if (inputPage < 1 || inputPage > maxPage + 1) {
      alert("ไม่มีหน้าที่ต้องการ");
      return;
    }

    if (typeof window != undefined) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setPage(inputPage);
  }

  useEffect(() => {
    if (data && data.length > 0) {
      setCurrentData(applyFiltersAndSort(data, filterParams));
      return;
    }
    setCurrentData([]);
  }, [data, filterParams]);

  return (
    <>
      <Layout>
        <div className="py-6">
          <div className="flex justify-between items-center px-[22px] py-2">
            <div className="text-xl font-bold">Pedigrees</div>
            <div
              id="search-bar"
              className="flex flex-col  items-end gap-3 mt-1 mb-1
        tabletS:mt-3
        tabletS:flex-row
        tabletS:items-center
        "
            >
              <form className="flex items-center gap-2">
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
              <label htmlFor="sort" className="space-x-2">
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
              <label htmlFor="color" className="space-x-2">
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
              <div className="flex items-center gap-2">
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
              <label htmlFor="sortBy" className="space-x-2">
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
