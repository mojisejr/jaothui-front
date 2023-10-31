const NBadge = () => {
  return (
    <button className="btn btn-circle font-bold text-xl bg-[#D9D9D9]">N</button>
  );
};
const RBadge = () => {
  return (
    <button className="btn btn-circle font-bold text-xl bg-[#093B49] text-base-200">
      R
    </button>
  );
};
const SRBadge = () => {
  return (
    <button className="btn btn-circle font-bold text-xl bg-[#B39929] text-base-200">
      SR
    </button>
  );
};
const SSRBadge = () => {
  return (
    <button className="btn btn-circle font-bold text-xl bg-[#8BD2B9] text-[#EA580C]">
      SSR
    </button>
  );
};

const data = [
  {
    image: "/images/n.gif",
    title: "NORMAL",
    subtitle: "80% of the collection",
    badge: <NBadge />,
  },
  {
    image: "/images/r.gif",
    title: "RARE",
    subtitle: "12% of the collection",
    badge: <RBadge />,
  },
  {
    image: "/images/sr.gif",
    title: "SUPER RARE",
    subtitle: "5% of the collection",
    badge: <SRBadge />,
  },
  {
    image: "/images/ssr.gif",
    title: "SUPER S. RARE",
    subtitle: "3% of the collection",
    badge: <SSRBadge />,
  },
];

interface NFTCardProp {
  rarity: 0 | 1 | 2 | 3;
}

const NFTCard = ({ rarity }: NFTCardProp) => {
  return (
    <>
      <div className="card w-[320px] bg-base-100 shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px]">
        <figure className=" py-2 overflow-hidden">
          <img
            className=" w-24/30 rounded-xl"
            src={data[rarity].image}
            alt="nft-image"
          />
        </figure>
        <div className="card-body">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-primary">
                {data[rarity].badge}
              </div>
              <div className="stat-title text-primary">Type</div>
              <div className="text-2xl font-bold text-neutral">
                {data[rarity].title}
              </div>
              <div className="stat-desc">{data[rarity].subtitle}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NFTCard;
