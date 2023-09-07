import type { NextPage } from "next";
import Layout from "../../components/v2/Layouts";
import NFTCard from "../../components/v2/Arttoy/Card/nft";

const Arttoy: NextPage = () => {
  return (
    <div className="relative">
      <Layout>
        <div className="relative">
          <img className="w-full" src="images/arttoyhero.png" alt="hero"></img>
          <div className="absolute bottom-4 px-2 py-2">
            <div className="text-5xl text-base-200">JAOTHUI</div>
            <div className="text-5xl font-bold text-primary">SOUVENIR</div>
            <div className="font-bold text-base-200">
              ยกระดับของสะสมด้วย Blockchain Tecnology
            </div>
          </div>
        </div>
        {/**Arttoy Box */}
        <div className="px-[22px]">
          <div className="flex justify-between items-center py-2">
            <div className="text-xl font-bold">Arttoy</div>
            {/* <a className="text-sm">ดูทั้งหมด{">"}</a> */}
          </div>
          <div className="text-xl py-6">Coming soon.</div>
        </div>
        <div className="px-[22px] py-6">
          <div className="flex justify-between items-center py-2">
            <div className="text-xl font-bold">NFT Profile</div>
            {/* <a className="text-sm">ดูทั้งหมด{">"}</a> */}
          </div>
          <div className="grid grid-cols-1 gap-6 place-items-center tabletS:grid-cols-2">
            <NFTCard rarity={0} />
            <NFTCard rarity={1} />
            <NFTCard rarity={2} />
            <NFTCard rarity={3} />
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default Arttoy;
