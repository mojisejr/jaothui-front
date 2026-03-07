import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { BiSearchAlt2 } from "react-icons/bi";

const GlobalNavSearch = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    const isNumeric = /^\d+$/.test(trimmedQuery);

    if (isNumeric) {
      await router.push(`/cert/${trimmedQuery}`);
    } else {
      await router.push(`/cert/search?q=${encodeURIComponent(trimmedQuery)}`);
    }

    setIsMobileExpanded(false);
  };

  return (
    <div className="relative z-40 flex items-center justify-end gap-2">
      <form onSubmit={handleSubmit} className="hidden w-full max-w-[260px] tabletM:block">
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

      {isMobileExpanded ? (
        <form onSubmit={handleSubmit} className="w-[min(72vw,240px)] tabletM:hidden">
          <label
            className="input input-bordered flex h-10 items-center gap-2 rounded-full border-white/10 bg-base-200/50 px-3 backdrop-blur-md"
            aria-label="Global pedigree search mobile"
          >
            <BiSearchAlt2 className="text-base-content/60" size={18} />
            <input
              type="text"
              className="grow bg-transparent"
              placeholder="Search"
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button
              type="button"
              className="text-base-content/50"
              aria-label="Collapse search"
              onClick={() => setIsMobileExpanded(false)}
            >
              ✕
            </button>
          </label>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-circle tabletM:hidden"
          aria-label="Open global search"
          onClick={() => setIsMobileExpanded(true)}
        >
          <BiSearchAlt2 size={20} />
        </button>
      )}
    </div>
  );
};

export default GlobalNavSearch;
