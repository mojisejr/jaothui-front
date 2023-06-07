import {
  FunctionComponent,
  PropsWithChildren,
  SyntheticEvent,
  useRef,
} from "react";

import PleaseConnectWallet from "../../../../components/sections/cert/PleaseConnect";
import Header from "../../../../components/Header";
import MenuModal from "../../../../components/MenuModal";
import CertFooter from "../../../../components/sections/cert/CertFooter";
import MyFarmDashboard from "../../../../components/sections/myfarm/Dashboard";
import { FiSearch } from "react-icons/fi";

import { useMenu } from "../../../../hooks/menuContext";
import { useBitkubNext } from "../../../../hooks/bitkubNextContext";
import { useRouter } from "next/router";
import { useFarm } from "../../../../hooks/useFarm";
import CreateFarm from "../../../../components/sections/myfarm/CreateFarm";

const MyFarm: FunctionComponent<PropsWithChildren> = () => {
  const { push } = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const { isConnected } = useBitkubNext();
  const { isOpen } = useMenu();
  const { farmData, isFarmLoading } = useFarm();
  // const { farmData } = useMyFarm();

  function handleSearch(e: SyntheticEvent) {
    const value =
      searchRef.current?.value == undefined ? 0 : +searchRef.current.value;

    if (value <= 0) {
      return;
    }

    push(
      `/cert/profile/myfarm/buffalo/${farmData?.farm.id}?microchip=${value}`
    );
  }

  return (
    <>
      <Header />
      <div
        className={`w-full bg-thuiyellow  p-3 flex  justify-center items-center
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
           text-thuiwhite"
            >
              <div>
                <div className="text-[30px]">FARM MANAGEMENT</div>
                <div className="flex justify-center items-center gap-2 rounded-2xl p-1 bg-thuiyellow">
                  <input
                    className="text-thuiwhite pl-2 pr-2 pt-1 pb-1 rounded-2xl outline-none bg-thuiyellow placeholder:text-thuidark placeholder:text-opacity-80"
                    type="text"
                    minLength={15}
                    maxLength={15}
                    placeholder="microchip Id (15 digits)"
                    ref={searchRef}
                  ></input>
                  <button
                    className="hover:text-thuiwhite text-thuidark pr-1"
                    onClick={(e) => handleSearch(e)}
                  >
                    <FiSearch size={30} />
                  </button>
                </div>
              </div>
              {!isFarmLoading ? (
                <div>
                  {farmData == undefined ? (
                    <CreateFarm />
                  ) : (
                    <MyFarmDashboard asset={farmData} />
                  )}
                </div>
              ) : (
                <div className="text-thuiwhite">Loading..</div>
              )}
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

export default MyFarm;
