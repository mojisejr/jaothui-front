import { Buffalo } from "../../interfaces/MyFarm/iBuffalo";
import TabletsTable from "./TabletsTable";
import MobileTable from "./MobileTables";

interface AssetListProps {
  farmId: number;
  buffalos: Buffalo[];
}

const AssetList = ({ farmId, buffalos }: AssetListProps) => {
  return (
    <div className="relative min-w-[300px] min-h-[500px] overflow-y-scroll p-3">
      <div className="tabletS:hidden block">
        <MobileTable farmId={farmId} buffalos={buffalos} />
      </div>
      <div className="hidden tabletS:block">
        <TabletsTable farmId={farmId} buffalos={buffalos} />
      </div>
    </div>
  );
};

export default AssetList;
