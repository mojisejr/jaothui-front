import Link from "next/link";
import { trpc } from "../../../utils/trpc";

const Pedigree = () => {
  const { data, isLoading } = trpc.metadata.getBatch.useQuery([
    "764040226300035",
    "764040226600001",
    "933004022017321",
    "900115003414178",
    "900115003414472",
    "764040226600008",
    "900115003739216",
    "764040226301331",
  ]);

  return (
    <>
      <div className="py-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-[22px] py-2">
          <div className="text-xl font-bold text-thuidark">Pedigrees</div>
          <Link href="/cert" className="text-sm font-semibold text-thuigray">
            ดูทั้งหมด{">"}
          </Link>
        </div>
        {!isLoading ? (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-[22px] py-2">
            {data
              ? data.map((item, index) => (
                  <Link
                    key={item.microchip}
                    href={`/cert/${item.microchip}`}
                    className="flex items-center gap-3 rounded-2xl border border-base-300 bg-thuiwhite p-3 shadow-sm transition hover:border-thuiyellow"
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-base-200">
                      <img
                        className="h-full w-full object-cover"
                        src={item.image ? item.image : "/images/thuiLogo.png"}
                        alt={item.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left text-thuidark">
                      <div className="truncate text-lg font-bold leading-tight">
                        {item.name}
                      </div>
                      <div className="mt-1 truncate text-sm font-bold text-thuigray">
                        Microchip: {item.microchip}
                      </div>
                      <div className="mt-1 line-clamp-1 text-sm font-semibold text-thuigray">
                        สายเลือด: {item.detail ? item.detail : "-"}
                      </div>
                    </div>
                    <div className="text-right text-xs font-bold text-thuigray">
                      #{index + 1}
                    </div>
                  </Link>
                ))
              : "ไม่มีข้อมูล"}
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-[22px] py-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`pedigree-skeleton-${index}`}
                className="flex animate-pulse items-center gap-3 rounded-2xl border border-base-300 bg-thuiwhite p-3 shadow-sm"
              >
                <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-base-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-2/3 rounded bg-base-300" />
                  <div className="h-4 w-1/2 rounded bg-base-300" />
                  <div className="h-4 w-3/4 rounded bg-base-300" />
                </div>
                <div className="h-4 w-8 rounded bg-base-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Pedigree;
