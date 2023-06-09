import { FunctionComponent, PropsWithChildren } from "react";
import PleaseConnectWallet from "../../../components/sections/cert/PleaseConnect";
import Header from "../../../components/Header";
import Collection from "../../../components/sections/cert/Collection";
import MenuModal from "../../../components/MenuModal";
import CertFooter from "../../../components/sections/cert/CertFooter";
import { useMenu } from "../../../hooks/menuContext";
import { useBitkubNext } from "../../../hooks/bitkubNextContext";

const MyCert: FunctionComponent<PropsWithChildren> = () => {
  const { isConnected, walletAddress } = useBitkubNext();
  const { isOpen } = useMenu();

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
        {isConnected ? (
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
              <Collection address={walletAddress} />
            </div>
          </div>
        ) : (
          <div>
            <PleaseConnectWallet />
          </div>
        )}
      </div>
      {isOpen ? <MenuModal /> : null}
      <CertFooter />
    </>
  );
};

export default MyCert;
