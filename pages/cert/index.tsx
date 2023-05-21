import { NextPage } from "next";

import Header from "../../components/Header";
import Profile from "../../components/sections/cert/Profile";
import Collection from "../../components/sections/cert/Collection";
import CollectionV2 from "../../components/sections/cert/CollectionV2";
import CertFooter from "../../components/sections/cert/CertFooter";

import MenuModal from "../../components/MenuModal";
import { useMenu } from "../../hooks/menuContext";
import { useGetAllMetadata } from "../../blockchain/Metadata/read";

const CertMainPage: NextPage = () => {
  const { isOpen } = useMenu();
  const { allMetadata } = useGetAllMetadata();

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
          shadow-[0px_13px_27px_-5px_rgba(0,0,0,0.60)]
        tabletS:p-3"
        >
          <div
            id="profile-container-inner"
            className="p-5 mb-2 flex flex-col gap-2
            tabletM:gap-[60px]"
          >
            {/* <Collection address={address} /> */}
            <CollectionV2 title={"Pedigree List"} certNFTs={allMetadata!} />
          </div>
        </div>
      </div>
      {isOpen ? <MenuModal /> : null}
      <CertFooter />
    </>
  );
};

export default CertMainPage;
