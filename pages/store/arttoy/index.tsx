import type { NextPage } from "next";
import NFTCard from "../../../components/Arttoy/Card/nft";
import { trpc } from "../../../utils/trpc";
import Loading from "../../../components/Shared/Indicators/Loading";
import StoreLayout from "../../../components/Layouts/StoreLayout";
import AllProductList from "../../../components/Store/Lists/AllProductList";
import ProductDetailModal from "../../../components/Store/Details/ProductDetailModal";
import ArttoyProductList from "../../../components/Store/Lists/ArttoyList";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import { useRouter } from "next/router";

const Arttoy = () => {
  const { isConnected } = useBitkubNext();
  const { replace } = useRouter();
  const { data, isLoading: arttoyLoading } = trpc.store.getCollctions.useQuery({
    handle: "arttoy",
  });

  if(!isConnected) {
    replace('/unauthorized');
    return;
  }

  return (
    <div className="relative">
      <StoreLayout
        heroImage="/images/arttoyhero.png"
        title="JAOTHUI"
        subTitle="SOUVENIR"
        smallTitle="ยกระดับของสะสมด้วย Blockchain Tecnology"
      >
        <ArttoyProductList />
        {/* {arttoyLoading ? (
          <div className="h-[200px] w-full flex justify-center items-center">
            <Loading size="lg" /> Loading..
          </div>
        ) : (
          <AllProductList products={data!} title="ARTTOY" />
        )} */}
        <div className="px-[22px] py-6">
          <div className="flex justify-between items-center py-2">
            <div className="text-xl font-bold">NFT Profile</div>
            {/* <a className="text-sm">ดูทั้งหมด{">"}</a> */}
          </div>
          {/* <div className="grid grid-cols-1 gap-6 place-items-center tabletS:grid-cols-2 labtop:grid-cols-3 desktopM:grid-cols-"> */}
          <div className="p-1 grid grid-cols-1 place-items-center tabletS:grid-cols-2 labtop:grid-cols-4 desktopM:grid-cols-6 gap-1">
            <NFTCard rarity={0} />
            <NFTCard rarity={1} />
            <NFTCard rarity={2} />
            <NFTCard rarity={3} />
          </div>
        </div>
        <ProductDetailModal />
      </StoreLayout>
    </div>
  );
};

export default Arttoy;

// <div className="relative">
//   <Layout>
//     <div className="relative">
//       <img className="w-full" src="/images/arttoyhero.png" alt="hero"></img>
//       <div className="absolute bottom-4 px-2 py-2 tabletM:bottom-10">
//         <div className="text-5xl text-base-200 tabletM:text-[5rem]">
//           JAOTHUI
//         </div>
//         <div className="text-5xl font-bold text-primary tabletM:text-[5rem]">
//           SOUVENIR
//         </div>
//         <div className="font-bold text-thuiwhite tabletM:text-4xl">
//           ยกระดับของสะสมด้วย Blockchain Tecnology
//         </div>
//       </div>
//     </div>
//     {/**Arttoy Box */}
//     {arttoyLoading ? (
//       <div className="h-[200px] w-full flex justify-center items-center">
//         <Loading size="lg" /> Loading..
//       </div>
//     ) : (
//       <ArttoyProductList />
//     )}
//     <div className="px-[22px] py-6">
//       <div className="flex justify-between items-center py-2">
//         <div className="text-xl font-bold">NFT Profile</div>
//         {/* <a className="text-sm">ดูทั้งหมด{">"}</a> */}
//       </div>
//       {/* <div className="grid grid-cols-1 gap-6 place-items-center tabletS:grid-cols-2 labtop:grid-cols-3 desktopM:grid-cols-"> */}
//       <div className="p-1 grid grid-cols-1 place-items-center tabletS:grid-cols-2 labtop:grid-cols-4 desktopM:grid-cols-6 gap-1">
//         <NFTCard rarity={0} />
//         <NFTCard rarity={1} />
//         <NFTCard rarity={2} />
//         <NFTCard rarity={3} />
//       </div>
//     </div>
//   </Layout>
// </div>
