import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";

const MainTitle = () => {
  const { push } = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValue = searchValue.trim();
    if (!normalizedValue) {
      return;
    }

    const isNumeric = /^\d+$/.test(normalizedValue);

    if (isNumeric) {
      push(`/cert/${normalizedValue}`);
      return;
    }

    push(`/cert/search?q=${encodeURIComponent(normalizedValue)}`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-[22px] py-10 text-center text-thuidark tabletS:py-16">
      <div className="flex justify-center">
        <Image
          className="h-auto w-[220px] tabletS:w-[260px]"
          src="/images/herov2.png"
          width={260}
          height={260}
          alt="jaothui-buffalo"
          priority
        />
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight tabletS:text-5xl">
        ตรวจสอบข้อมูลควายไทย
      </h1>
      <p className="mt-2 text-sm text-thuigray tabletS:text-lg">
        ค้นหาด้วยเลขไมโครชิป หรือชื่อที่ต้องการ
      </p>

      <form
        onSubmit={handleSearch}
        className="mx-auto mt-6 flex w-full max-w-3xl flex-col gap-3 tabletS:flex-row"
      >
        <input
          type="text"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="กรอกเลขไมโครชิป เช่น 900115003414178"
          className="input input-bordered h-14 w-full rounded-2xl border-2 border-thuigray/30 bg-thuiwhite px-5 text-base text-thuidark placeholder:text-thuigray/60 focus:border-thuiyellow focus:outline-none"
        />
        <button
          type="submit"
          className="btn h-14 min-h-14 rounded-2xl border-0 bg-thuiyellow px-8 text-base font-bold text-thuidark hover:bg-thuiyellow"
        >
          ค้นหา
        </button>
      </form>

      <p className="mt-3 text-xs text-thuigray tabletS:text-sm">
        กด Enter เพื่อค้นหาได้ทันที
      </p>
    </div>
  );
};

export default MainTitle;
