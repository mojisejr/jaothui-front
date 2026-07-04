import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { FiSliders } from "react-icons/fi";
import { trpc } from "../../utils/trpc";
import {
  V2Layout,
  SearchInput,
  FilterChip,
  FilterDrawer,
  DEFAULT_FILTER,
  BuffaloCard,
  Pagination,
  RemoteImage,
  formatThaiBirthdate,
  type BuffaloFilter,
} from "../../components/v2";

const RECENT_KEY = "jaothui-cert-recently-viewed";

interface RecentItem {
  microchip: string;
  name: string;
  image?: string;
  timestamp: number;
}

/** Non-default filters → removable chips (maps the mockup's chip row to REAL active filters). */
function activeChips(f: BuffaloFilter): { key: keyof BuffaloFilter | "age"; label: string }[] {
  const chips: { key: keyof BuffaloFilter | "age"; label: string }[] = [];
  if (f.sex !== "all") chips.push({ key: "sex", label: f.sex === "female" ? "เพศเมีย" : "เพศผู้" });
  if (f.color !== "all") chips.push({ key: "color", label: f.color === "black" ? "สีดำ" : "เผือก" });
  if (f.ageValue.trim() !== "") chips.push({ key: "age", label: `อายุ ${f.ageOperator} ${f.ageValue} เดือน` });
  if (f.sortBy !== "latest")
    chips.push({ key: "sortBy", label: f.sortBy === "oldest" ? "เก่าสุด" : "อายุน้อยสุด" });
  return chips;
}

export default function V2BuffaloPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<BuffaloFilter>(DEFAULT_FILTER);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  // debounce search → server param
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // recently-viewed (localStorage, real /cert convention)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent((JSON.parse(raw) as RecentItem[]).slice(0, 8));
    } catch {
      /* ignore */
    }
  }, []);

  const { data, isLoading, isFetching } = trpc.metadata.getAll.useQuery(
    { page, filter: { ...filter, search } },
    { keepPreviousData: true }
  );

  const chips = useMemo(() => activeChips(filter), [filter]);
  const items = data?.items ?? [];

  const patchFilter = (patch: Partial<BuffaloFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const clearChip = (key: keyof BuffaloFilter | "age") => {
    if (key === "age") patchFilter({ ageValue: "" });
    else patchFilter({ [key]: DEFAULT_FILTER[key as keyof BuffaloFilter] } as Partial<BuffaloFilter>);
  };

  const openBuffalo = (item: { microchip: string; name: string; image?: string }) => {
    try {
      const next: RecentItem[] = [
        { microchip: item.microchip, name: item.name, image: item.image, timestamp: Date.now() },
        ...recent.filter((r) => r.microchip !== item.microchip),
      ].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    router.push(`/cert/${item.microchip}`);
  };

  return (
    <V2Layout activeTab="buffalo">
      <div className="mx-auto w-full max-w-5xl px-5 pb-2 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">NFT เพชรดีกรี</h1>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="ตัวกรอง"
            className="relative flex h-10 w-10 items-center justify-center rounded-pill border border-border-soft text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <FiSliders className="h-4 w-4" />
            {chips.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent px-1 text-[10px] font-bold text-background">
                {chips.length}
              </span>
            )}
          </button>
        </div>

        <SearchInput
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ค้นหาเลขชิป, ชื่อควาย"
        />

        {chips.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {chips.map((c) => (
              <FilterChip key={String(c.key)} active onClick={() => clearChip(c.key)}>
                {c.label} ✕
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-5 py-3">
          <h2 className="mb-2 text-sm font-semibold text-muted">ดูล่าสุด</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recent.map((r) => (
              <button
                key={r.microchip}
                type="button"
                onClick={() => openBuffalo(r)}
                className="flex w-16 shrink-0 flex-col items-center gap-1"
              >
                <span className="relative h-16 w-16 overflow-hidden rounded-pill border border-border-soft bg-surface-raised">
                  <RemoteImage src={r.image} alt={r.name} sizes="64px" className="object-cover" />
                </span>
                <span className="w-full truncate text-center text-[11px] text-muted">{r.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-5xl px-5 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse flex-col overflow-hidden rounded-card border border-border-soft bg-surface"
              >
                <div className="aspect-[4/3] w-full bg-surface-raised" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-2/3 rounded bg-surface-raised" />
                  <div className="h-3 w-1/2 rounded bg-surface-raised" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <BuffaloCard
                  key={item.microchip}
                  name={item.name}
                  chip={item.microchip}
                  birthdate={formatThaiBirthdate(item.birthdate)}
                  ageMonths={item.calculatedAge}
                  image={<RemoteImage src={item.image} alt={item.name} className="object-cover" />}
                  onClick={() => openBuffalo(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-card border border-dashed border-border-soft px-4 py-10 text-center text-sm text-muted">
            ไม่พบกระบือที่ตรงกับเงื่อนไข
          </p>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-6">
            <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        )}
      </section>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        value={filter}
        onChange={patchFilter}
        onReset={() => {
          setFilter(DEFAULT_FILTER);
          setPage(1);
        }}
      />
    </V2Layout>
  );
}
