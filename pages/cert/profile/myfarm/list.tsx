import {
  FunctionComponent,
  PropsWithChildren,
  SyntheticEvent,
  useRef,
} from "react";

import { FiSearch } from "react-icons/fi";

import { useMenu } from "../../../../contexts/menuContext";
import { useBitkubNext } from "../../../../contexts/bitkubNextContext";
import { useRouter } from "next/router";
import AssetList from "../../../../components/MyFarm/AssetList";
import Link from "next/link";
import { FaArrowCircleLeft } from "react-icons/fa";
import { trpc } from "../../../../utils/trpc";
import Layout from "../../../../components/Layouts";
import BitkubNextConnectButton from "../../../../components/Shared/BitkubNext";

const BuffaloList: FunctionComponent<PropsWithChildren> = () => {
  const { push } = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const { isConnected, walletAddress } = useBitkubNext();
  const { isOpen } = useMenu();
  const { data, isLoading } = trpc.farm.get.useQuery({ wallet: walletAddress });
  const { replace } = useRouter();

  function handleSearch(e: SyntheticEvent) {
    const value =
      searchRef.current?.value == undefined ? 0 : +searchRef.current.value;

    if (value <= 0) {
      return;
    }

    push(`/cert/profile/myfarm/buffalo/${data.farm.id}?microchip=${value}`);
  }

  if(!isConnected) {
    replace("/unauthorized");
    return;
  }


  return (
    <>
      <Layout>
        <div
          className={`w-full bg-base-200 p-3 flex  justify-center items-center
        min-h-screen
      
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
                className="relative p-5 mb-2 flex flex-col gap-2
             text-thuiwhite"
              >
                <div
                  id="card-hole"
                  className="absolute top-3 right-3 w-[25px] h-[25px] bg-base-200 rounded-[200px]
        shadow-[inset_-2px_2px_2px_1px_rgba(0,0,0,0.30)]
        "
                ></div>
                <div>
                  <div className="text-[30px]">Asset List</div>
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
                {isLoading && data == undefined ? (
                  <div className="text-thuiwhite">Loading..</div>
                ) : (
                  <div>
                    <AssetList
                      farmId={data.farm.id}
                      buffalos={data.farm.buffalos}
                    />
                    <Link
                      href={"/cert/profile/myfarm"}
                      className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
              hover:bg-thuiyellow"
                    >
                      <FaArrowCircleLeft />
                      Back
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="py-2">Please Connect Wallet</div>
              <BitkubNextConnectButton />
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default BuffaloList;
