import type { NextPage } from "next";
import Layout from "../../components/Layouts";
import NFTCard from "../../components/Arttoy/Card/nft";
import ArttoyProductList from "../../components/Store/ArttoyList";
import { trpc } from "../../utils/trpc";
import Loading from "../../components/Shared/Indicators/Loading";
import { ToastContainer } from "react-toastify";

const Arttoy: NextPage = () => {
  const { isLoading: arttoyLoading } = trpc.store.get.useQuery();

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
        {arttoyLoading ? <Loading size="lg" /> : <ArttoyProductList />}
        <div className="px-[22px] py-6">
          <div className="flex justify-between items-center py-2">
            <div className="text-xl font-bold">NFT Profile</div>
            {/* <a className="text-sm">ดูทั้งหมด{">"}</a> */}
          </div>
          {/* <div className="grid grid-cols-1 gap-6 place-items-center tabletS:grid-cols-2 labtop:grid-cols-3 desktopM:grid-cols-"> */}
          <div className="p-1 grid grid-cols-2 place-items-center tabletS:grid-cols-3 labtop:grid-cols-4 desktopM:grid-cols-6 gap-1">
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
