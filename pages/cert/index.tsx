import { NextPage } from "next";

import Header from "../../components/Header";
import Profile from "../../components/sections/cert/Profile";
import Collection from "../../components/sections/cert/Collection";
import CertFooter from "../../components/sections/cert/CertFooter";

import { useAccount } from "wagmi";
import PleaseConnectWallet from "../../components/sections/cert/PleaseConnect";
import MenuModal from "../../components/MenuModal";
import { useMenu } from "../../hooks/menuContext";

const CertMainPage: NextPage = () => {
  const { isConnected, address } = useAccount();
  const { isOpen } = useMenu();

  return (
    <>
      <Header />
      <div
        className={`w-full bg-thuiyellow h-full p-3 
      tabletS:p-[30px]
      tabletS:h-screen
      tabletM:h-full
      tabletM:p-[60px]
     `}
      >
        {isConnected ? (
          <div
            id="profile-container"
            className="bg-thuigray rounded-md
        tabletS:p-3"
          >
            <div
              id="profile-container-inner"
              className="p-5 mb-2 flex flex-col gap-2
            tabletM:gap-[60px]"
            >
              <Profile />
              <Collection address={address} />
            </div>
          </div>
        ) : (
          <PleaseConnectWallet />
        )}
      </div>
      {isOpen ? <MenuModal /> : null}
      <CertFooter />
    </>
  );
};

export default CertMainPage;
