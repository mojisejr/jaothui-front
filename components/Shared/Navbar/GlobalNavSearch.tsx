import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { BiSearchAlt2 } from "react-icons/bi";

const GlobalNavSearch = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    await router.push(`/cert?search=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[240px]">
      <label
        className="input input-bordered flex h-10 items-center gap-2 rounded-full border-white/10 bg-base-200/50 px-3 backdrop-blur-md"
        aria-label="Global pedigree search"
      >
        <BiSearchAlt2 className="text-base-content/60" size={18} />
        <input
          type="text"
          className="grow bg-transparent"
          placeholder="Search pedigree"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </label>
    </form>
  );
};

export default GlobalNavSearch;
