import { NextPage } from "next";

import Header from "../../components/Header";
import Profile from "../../components/sections/cert/Profile";
import Collection from "../../components/sections/cert/Collection";
import CollectionV2 from "../../components/sections/cert/CollectionV2";
import CertFooter from "../../components/sections/cert/CertFooter";

import { useAccount } from "wagmi";
import PleaseConnectWallet from "../../components/sections/cert/PleaseConnect";
import MenuModal from "../../components/MenuModal";
import { useMenu } from "../../hooks/menuContext";
import { useGetAllMetadata } from "../../blockchain/cert/read";

const CertMainPage: NextPage = () => {
  const { isConnected, address } = useAccount();
  const { isOpen } = useMenu();
  const { metadata, metaRefetch } = useGetAllMetadata();

  return (
    <>
      <Header />
      <div
        className={`w-full bg-thuiyellow h-full p-3 flex  justify-center items-center
      tabletS:p-[30px]
      tabletS:h-screen
      tabletM:h-full
      tabletM:p-[60px]
      
     `}
      >
        <div
          id="profile-container"
          className="bg-thuigray rounded-md max-w-[1200px]
        tabletS:p-3"
        >
          <div
            id="profile-container-inner"
            className="p-5 mb-2 flex flex-col gap-2
            tabletM:gap-[60px]"
          >
            {/* <Collection address={address} /> */}
            <CollectionV2 title={"Pedigree List"} certNFTs={metadata!} />
          </div>
        </div>
      </div>
      {isOpen ? <MenuModal /> : null}
      <CertFooter />
    </>
  );
};

export default CertMainPage;
