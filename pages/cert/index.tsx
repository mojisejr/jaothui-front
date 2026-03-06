import { NextPage } from "next";

import Layout from "../../components/Layouts";
import PedigreeCard from "../../components/Shared/Card/PedigreeCard";
import { SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { IMetadata } from "../../interfaces/iMetadata";
import Loading from "../../components/Shared/Indicators/Loading";
import { trpc } from "../../utils/trpc";
import {
  FiChevronsLeft,
  FiChevronsRight,
  FiLoader,
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi";
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
const SKELETON_CARD_COUNT = 8;

function getActiveFilterBadges(filterParams: FilterParams) {
  const badges: Array<{ key: keyof FilterParams | "age"; label: string }> = [];

  if (filterParams.sex !== "all") {
    badges.push({
      key: "sex",
      label: filterParams.sex === "female" ? "Sex: Female" : "Sex: Male",
    });
  }

  if (filterParams.color !== "all") {
    badges.push({
      key: "color",
      label: filterParams.color === "albino" ? "Color: เผือก" : "Color: ดำ",
    });
  }

  if (filterParams.ageValue.trim().length > 0) {
    badges.push({
      key: "age",
      label: `Age ${filterParams.ageOperator} ${filterParams.ageValue.trim()} เดือน`,
    });
  }

  if (filterParams.sortBy !== "latest") {
    badges.push({
      key: "sortBy",
      label:
        filterParams.sortBy === "oldest"
          ? "Sort: Oldest First"
          : "Sort: Youngest First",
    });
  }

  return badges;
}

function DiscoverySkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-2 px-2 place-items-center tabletS:grid-cols-2 tabletS:px-10 tabletM:px-[10rem] labtop:grid-cols-3 labtop:px-[13rem] desktopM:grid-cols-4 desktopM:gap-3 desktopM:px-[18rem]">
      {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
        <div
          key={index}
          className="w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur animate-pulse"
        >
          <div className="mb-4 h-52 rounded-2xl bg-white/10" />
          <div className="space-y-3">
            <div className="h-5 w-2/3 rounded-full bg-white/10" />
            <div className="h-4 w-1/2 rounded-full bg-white/10" />
            <div className="h-4 w-5/6 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DiscoveryEmptyState({
  hasActiveFilters,
  search,
  onClear,
  onOpenDrawer,
}: {
  hasActiveFilters: boolean;
  search: string;
  onClear: () => void;
  onOpenDrawer: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-primary">
        <FiSearch size={24} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">No pedigree matches found</h2>
        <p className="text-sm text-base-content/70">
          {search.trim().length > 0
            ? `No results for \"${search.trim()}\" with the current discovery setup.`
            : "No results matched the current discovery filters."}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-base-content/70">
        <span className="rounded-full border border-white/10 px-3 py-1.5">
          {hasActiveFilters ? "Active filters are narrowing the list" : "Try a broader search term"}
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1.5">
          Global search is running against the full pedigree database
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="btn btn-primary rounded-2xl"
          >
            Clear Filters
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="btn btn-outline rounded-2xl border-white/10"
        >
          <FiSliders size={16} />
          Refine Discovery
        </button>
      </div>
    </div>
  );
}

const CertMainPage: NextPage = () => {
  const { query } = useRouter();
  const { isConnected, walletAddress } = useBitkubNext();
  const [maxPage, setMaxPage] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterParams, setFilterParams] =
    useState<FilterParams>(DEFAULT_FILTER_PARAMS);
  const queryInput = useMemo(
    () => ({
      page,
      filter: {
        ...filterParams,
        ageValue: filterParams.ageValue.trim(),
        search: filterParams.search.trim(),
      },
    }),
    [filterParams, page]
  );
  const { data, isFetching, isLoading } = trpc.metadata.getAll.useQuery(
    queryInput,
    {
      keepPreviousData: true,
    }
  );
  const [currentData, setCurrentData] = useState<IMetadata[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const gotoPageRef = useRef<HTMLInputElement>(null);
  const activeFilterBadges = useMemo(
    () => getActiveFilterBadges(filterParams),
    [filterParams]
  );
  const hasActiveFilters = activeFilterBadges.length > 0;
  const isInitialLoading = isLoading && currentData.length === 0;
  const isRefreshingResults = isFetching && !isInitialLoading;

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

  function handleRemoveBadge(key: keyof FilterParams | "age") {
    if (key === "age") {
      updateFilterParams("ageValue", "");
      return;
    }

    if (key === "sex") {
      updateFilterParams("sex", DEFAULT_FILTER_PARAMS.sex);
      return;
    }

    if (key === "color") {
      updateFilterParams("color", DEFAULT_FILTER_PARAMS.color);
      return;
    }

    if (key === "sortBy") {
      updateFilterParams("sortBy", DEFAULT_FILTER_PARAMS.sortBy);
    }
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

  function closeFilterDrawer() {
    setIsFilterDrawerOpen(false);
  }

  function handleNextPage() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setPage((prev) => Math.min(prev + 1, maxPage));
  }

  function handlePrevPage() {
    if (page <= 1) {
      return;
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setPage((prev) => Math.max(prev - 1, 1));
  }

  function handleGoToPage(e: SyntheticEvent) {
    e.preventDefault();
    const inputPage = parseInt(gotoPageRef.current?.value || "", 10);

    if (!inputPage) {
      alert("กรุณากรอกข้อมูลว่าจะไปที่หน้าไหน");
      return;
    }

    if (inputPage < 1 || inputPage > maxPage) {
      alert("ไม่มีหน้าที่ต้องการ");
      return;
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setPage(inputPage);
    closeFilterDrawer();
  }

  useEffect(() => {
    setMaxPage(Math.max(data?.totalPages || 0, 1));
  }, [data]);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    if (isFilterDrawerOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFilterDrawerOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFilterDrawer();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      <Layout>
        <div className="py-6">
          <div className="sticky top-0 z-20 border-b border-white/10 bg-base-100/80 px-[22px] pb-3 pt-2 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 py-2">
              <div>
                <div className="text-xl font-bold">Pedigrees</div>
                <div className="text-sm font-semibold text-primary">
                  Live: {currentData?.length || 0} / {data?.totalCount || 0}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="btn btn-outline btn-sm rounded-2xl border-white/10"
              >
                <FiSliders size={16} />
                Filters
                {hasActiveFilters ? (
                  <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {activeFilterBadges.length}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="flex flex-col gap-3 tabletS:flex-row tabletS:items-center">
              <label
                htmlFor="search"
                className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <FiSearch className="text-primary" size={16} />
                <input
                  id="search"
                  type="text"
                  value={filterParams.search}
                  onChange={(e) => updateFilterParams("search", e.target.value)}
                  placeholder="Search by name or microchip"
                  className="w-full bg-transparent outline-none placeholder:text-base-content/50"
                />
              </label>

              <div className="flex items-center gap-2 text-sm text-base-content/70">
                {isRefreshingResults ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-primary">
                    <FiLoader className="animate-spin" size={14} />
                    Updating results...
                  </span>
                ) : null}
                <span className="rounded-full border border-white/10 px-3 py-1.5">
                  Page {page}/{maxPage}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5">
                  {data?.totalCount || 0} results
                </span>
              </div>
            </div>

            {hasActiveFilters ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeFilterBadges.map((badge) => (
                  <button
                    key={`${badge.key}-${badge.label}`}
                    type="button"
                    onClick={() => handleRemoveBadge(badge.key)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium"
                  >
                    <span>{badge.label}</span>
                    <FiX size={12} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-primary"
                >
                  Clear all
                </button>
              </div>
            ) : (
              <div className="mt-3 text-xs text-base-content/60">
                No active filters. Open the drawer for advanced discovery.
              </div>
            )}
          </div>

          {isFilterDrawerOpen ? (
            <div
              className="fixed inset-0 z-40 flex items-end bg-black/60 tabletS:items-stretch tabletS:justify-end"
              onClick={closeFilterDrawer}
            >
              <div
                className="relative w-full max-h-[88vh] overflow-y-auto rounded-t-[28px] border border-white/10 bg-base-100 p-5 shadow-2xl tabletS:h-full tabletS:max-h-none tabletS:max-w-md tabletS:rounded-none tabletS:rounded-l-[28px]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold">Filter Drawer</div>
                    <div className="text-sm text-base-content/70">
                      Minimal controls for global pedigree discovery.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeFilterDrawer}
                    className="btn btn-ghost btn-sm btn-circle"
                    aria-label="Close filter drawer"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-sm font-semibold">Sex</div>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ["all", "All"],
                        ["female", "Female"],
                        ["male", "Male"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateFilterParams("sex", value)}
                          className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                            filterParams.sex === value
                              ? "border-primary bg-primary text-white"
                              : "border-white/10 bg-transparent"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-sm font-semibold">Color</div>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ["all", "All"],
                        ["black", "ดำ"],
                        ["albino", "เผือก"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateFilterParams("color", value)}
                          className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                            filterParams.color === value
                              ? "border-primary bg-primary text-white"
                              : "border-white/10 bg-transparent"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-sm font-semibold">Age Filter</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={filterParams.ageOperator}
                        onChange={(e) =>
                          updateFilterParams(
                            "ageOperator",
                            e.target.value as FilterParams["ageOperator"]
                          )
                        }
                        className="select select-sm rounded-2xl border-white/10 bg-base-100"
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
                        onChange={(e) =>
                          updateFilterParams("ageValue", e.target.value)
                        }
                        placeholder="months"
                        className="input input-bordered input-sm w-32 rounded-2xl border-white/10"
                      />
                      <span className="text-sm text-base-content/70">months</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 text-sm font-semibold">Sort</div>
                    <select
                      value={filterParams.sortBy}
                      onChange={(e) =>
                        updateFilterParams(
                          "sortBy",
                          e.target.value as FilterParams["sortBy"]
                        )
                      }
                      className="select w-full rounded-2xl border-white/10 bg-base-100"
                    >
                      <option value="latest">Latest</option>
                      <option value="oldest">Oldest First</option>
                      <option value="youngest">Youngest First</option>
                    </select>
                  </div>

                  <form
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    onSubmit={handleGoToPage}
                  >
                    <div className="mb-3 text-sm font-semibold">Quick Jump</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={maxPage}
                        required
                        ref={gotoPageRef}
                        className="input input-bordered input-sm w-28 rounded-2xl border-white/10"
                        placeholder="Page"
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm rounded-2xl"
                      >
                        Go
                      </button>
                    </div>
                  </form>
                </div>

                <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-white/10 bg-base-100/95 pt-4 backdrop-blur">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="btn btn-outline rounded-2xl border-white/10"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={closeFilterDrawer}
                    className="btn btn-primary rounded-2xl"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {recentlyViewed.length > 0 ? (
            <div className="mb-3 mt-4 px-[22px]">
              <div className="mb-2 text-sm font-semibold">Recently Viewed</div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recentlyViewed.map((item) => (
                  <Link
                    key={item.microchip}
                    href={`/cert/${item.microchip}`}
                    className="flex flex-shrink-0 flex-col items-center gap-1"
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/10">
                      <Image
                        src={item.image || "images/thuiLogo.png"}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="max-w-[72px] truncate text-center text-xs">
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {isInitialLoading ? (
            <div className="space-y-6 pt-6">
              <div className="flex w-full justify-center">
                <Loading size="lg" />
              </div>
              <DiscoverySkeletonGrid />
            </div>
          ) : (
            <>
              {currentData.length <= 0 ? (
                <div className="px-[22px] pt-6">
                  <DiscoveryEmptyState
                    hasActiveFilters={hasActiveFilters}
                    search={filterParams.search}
                    onClear={handleClearFilters}
                    onOpenDrawer={() => setIsFilterDrawerOpen(true)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {isRefreshingResults ? (
                    <div className="px-[22px]">
                      <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary backdrop-blur">
                        Refreshing global results from the server...
                      </div>
                    </div>
                  ) : null}
                  <div className="place-items-center grid grid-cols-1 gap-2 px-2 tabletS:grid-cols-2 tabletS:px-10 tabletM:px-[10rem] labtop:grid-cols-3 labtop:px-[13rem] desktopM:grid-cols-4 desktopM:gap-3 desktopM:px-[18rem]">
                  {currentData.map((d, index) => (
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
                  ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mb-10 flex w-full items-center justify-center gap-10">
          <button
            disabled={page <= 1}
            className="btn btn-primary"
            onClick={handlePrevPage}
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
            onClick={handleNextPage}
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
