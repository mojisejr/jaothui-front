import {
  FunctionComponent,
  PropsWithChildren,
  SyntheticEvent,
  useEffect,
  useState,
} from "react";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import Layout from "../../../components/v2/Layouts";
import BitkubNextConnectButton from "../../../components/BitkubNext";
import { IMetadata } from "../../../interfaces/iMetadata";
import { useGetMetadataOf } from "../../../blockchain/Metadata/read";
import PedigreeCard from "../../../components/v2/Shared/Card/PedigreeCard";
import Loading from "../../../components/v2/Shared/Indicators/Loading";

const MyCert: FunctionComponent<PropsWithChildren> = () => {
  const { isConnected, walletAddress } = useBitkubNext();
  const { metadataOfOwner } = useGetMetadataOf();
  const [sortState, setSortState] = useState<number>(0);
  const [currentData, setCurrentData] = useState<IMetadata[]>(metadataOfOwner);

  function handleSorting(e: SyntheticEvent) {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      value: number;
    };

    switch (+target.value) {
      case 1: {
        const sorted = metadataOfOwner.filter((f) => f.sex == "female");
        console.log(sorted);
        setCurrentData(sorted);
        break;
      }
      case 2: {
        const sorted = metadataOfOwner.filter((f) => f.sex == "male");
        setCurrentData(sorted);
        break;
      }
      default: {
        break;
      }
    }
    setSortState(target.value);
  }

  useEffect(() => {
    if (metadataOfOwner.length > 0 && sortState == 0) {
      setCurrentData(metadataOfOwner);
    }
  }, [metadataOfOwner, sortState]);

  return (
    <>
      <Layout>
        <div className="w-full bg-base-200">
          {isConnected ? (
            <div className="py-6">
              <div className="flex justify-between items-center px-[22px] py-2">
                <div className="text-xl font-bold">Pedigrees</div>
                <div
                  id="search-bar"
                  className="flex items-center gap-3 mt-1 mb-1
            tabletS:mt-3
            "
                >
                  <label htmlFor="sort" className="space-x-2">
                    <span className="text-thuiwhite">sortBy:</span>
                    <select
                      onChange={(e) => handleSorting(e)}
                      id="sort"
                      className="p-2 rounded-md"
                    >
                      <option value={0}>All</option>
                      <option value={1}>Female</option>
                      <option value={2}>Male</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 place-items-center tabletS:grid-cols-2">
                {currentData ? (
                  currentData.map((d, index) => (
                    <PedigreeCard key={index} data={d} />
                  ))
                ) : (
                  <Loading size="lg" />
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

export default MyCert;
