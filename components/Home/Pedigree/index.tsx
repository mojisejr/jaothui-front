import Link from "next/link";
import { trpc } from "../../../utils/trpc";

const pedigreeBatch = [
  "764040226300035",
  "764040226600001",
  "933004022017321",
  "900115003414178",
  "900115003414472",
  "764040226600008",
  "900115003739216",
  "764040226301331",
];

const Pedigree = () => {
  const { data, isLoading } = trpc.metadata.getBatch.useQuery(pedigreeBatch);

  return (
    <>
      <div className="py-6 tabletS:pb-6 tabletS:pt-0 labtop:pb-8">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-[22px] py-2 tabletS:max-w-[1400px]">
          <div className="text-xl font-bold text-thuidark">Pedigrees</div>
          <Link href="/cert" className="text-sm font-semibold text-thuigray">
            ดูทั้งหมด{">"}
          </Link>
        </div>
        {!isLoading ? (
          <>
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-[22px] py-2 tabletS:hidden">
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
                        {/* <div className="mt-1 line-clamp-1 text-sm font-semibold text-thuigray">
                          สายเลือด: {item.detail ? item.detail : "-"}
                        </div> */}
                      </div>
                      <div className="text-right text-xs font-bold text-thuigray">
                        #{index + 1}
                      </div>
                    </Link>
                  ))
                : "ไม่มีข้อมูล"}
            </div>

            <div className="hidden tabletS:block">
              <div className="mx-auto w-full max-w-[1400px] px-[22px] py-2">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-16 bg-gradient-to-r from-thuiwhite via-thuiwhite/90 to-transparent tabletM:block" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-20 bg-gradient-to-l from-thuiwhite via-thuiwhite/95 to-transparent tabletM:block" />
                  <div className="scrollbar-none flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 tabletS:pr-10 tabletM:pl-4 tabletM:pr-16">
                  {data
                    ? data.map((item, index) => (
                        <Link
                          key={item.microchip}
                          href={`/cert/${item.microchip}`}
                          className="group flex h-[184px] w-[380px] shrink-0 snap-center overflow-hidden rounded-[30px] border border-base-300 bg-gradient-to-br from-thuiwhite via-thuiwhite to-[#fff8e8] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-thuiyellow hover:shadow-xl"
                        >
                          <div className="relative flex w-[168px] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff7df] via-[#fffdf4] to-thuiwhite p-4">
                            <img
                              className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                              src={item.image ? item.image : "/images/thuiLogo.png"}
                              alt={item.name}
                            />
                            <div className="absolute left-4 top-4 rounded-full bg-thuiwhite/95 px-3 py-1 text-xs font-bold text-thuidark shadow-sm">
                              #{index + 1}
                            </div>
                            <div className="absolute bottom-4 left-4 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-thuigray backdrop-blur-sm">
                              Pedigree
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col justify-between p-6 text-left text-thuidark">
                            <div className="min-w-0">
                              <div className="text-xs font-bold uppercase tracking-[0.24em] text-thuigray/70">
                                Thai Buffalo
                              </div>
                              <div className="mt-2 line-clamp-2 text-2xl font-bold leading-tight">
                                {item.name}
                              </div>
                              <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-thuigray/70">
                                Microchip
                              </div>
                              <div className="mt-2 inline-flex max-w-full rounded-full bg-base-200/70 px-3 py-1 text-sm font-semibold text-thuigray/90">
                                <span className="truncate">{item.microchip}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-base-300/70 pt-4 text-sm font-semibold text-thuigray">
                              <span className="text-thuidark/80">เปิดดูใบพันธุ์ประวัติ</span>
                              <span className="flex items-center gap-2 text-thuiyellow transition group-hover:translate-x-1">
                                <span className="text-xs uppercase tracking-[0.2em] text-thuigray/70">
                                  View
                                </span>
                                <span className="text-lg leading-none">→</span>
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    : <div className="rounded-2xl border border-dashed border-base-300 bg-thuiwhite px-6 py-10 text-thuigray">ไม่มีข้อมูล</div>}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-[22px] py-2 tabletS:hidden">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`pedigree-skeleton-mobile-${index}`}
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

            <div className="hidden tabletS:block">
              <div className="mx-auto w-full max-w-[1400px] px-[22px] py-2">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-16 bg-gradient-to-r from-thuiwhite via-thuiwhite/90 to-transparent tabletM:block" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-20 bg-gradient-to-l from-thuiwhite via-thuiwhite/95 to-transparent tabletM:block" />
                  <div className="scrollbar-none flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 tabletS:pr-10 tabletM:pl-4 tabletM:pr-16">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`pedigree-skeleton-desktop-${index}`}
                      className="flex h-[184px] w-[380px] shrink-0 snap-center animate-pulse overflow-hidden rounded-[30px] border border-base-300 bg-gradient-to-br from-thuiwhite via-thuiwhite to-[#fff8e8] shadow-sm"
                    >
                      <div className="relative flex w-[168px] shrink-0 items-center justify-center bg-gradient-to-br from-[#fff7df] via-[#fffdf4] to-thuiwhite p-4">
                        <div className="h-full w-full rounded-[24px] bg-base-300/80" />
                        <div className="absolute left-4 top-4 h-6 w-10 rounded-full bg-white/80" />
                        <div className="absolute bottom-4 left-4 h-6 w-24 rounded-full bg-white/70" />
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-6">
                        <div className="space-y-3">
                          <div className="h-3 w-20 rounded-full bg-base-300/70" />
                          <div className="h-7 w-11/12 rounded-xl bg-base-300" />
                          <div className="h-7 w-8/12 rounded-xl bg-base-300/90" />
                          <div className="pt-1 space-y-2">
                            <div className="h-3 w-24 rounded-full bg-base-300/70" />
                            <div className="h-8 w-9/12 rounded-full bg-base-300/90" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-base-300/70 pt-4">
                          <div className="h-4 w-28 rounded-full bg-base-300/80" />
                          <div className="h-4 w-12 rounded-full bg-base-300/70" />
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Pedigree;
