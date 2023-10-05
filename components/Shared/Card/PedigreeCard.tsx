import Link from "next/link";
import { IMetadata } from "../../../interfaces/iMetadata";
import CountryFlag from "../CountryFlag";
import Loading from "../Indicators/Loading";
interface PedigreeCardProps {
  data: IMetadata;
}

const PedigreeCard = ({ data }: PedigreeCardProps) => {
  return (
    <>
      <Link
        href={`/cert/${data ? data.microchip : null}`}
        className="w-[320px] rounded-xl shadow-xl"
      >
        <div className="p-4">
          <img
            className="w-full rounded-xl"
            src={data ? data.image : "images/thuiLogo.png"}
            alt="image"
          />
          <div className="w-full rounded-xl shadow p-3 flex justify-between items-center">
            <div>
              <div className="text-primary">
                {data ? data.microchip : <Loading size="sm" />}
              </div>
              <div className="font-bold text-xl">
                {data ? data.name : <Loading size="sm" />}
              </div>
              <div className="text-sm">
                {data ? data.createdAt : <Loading size="sm" />}
              </div>
            </div>
            <div>
              <CountryFlag country={data ? data.origin : "thai"} size="48x36" />
            </div>
          </div>
        </div>
      </Link>
    </>
  );
};

export default PedigreeCard;
