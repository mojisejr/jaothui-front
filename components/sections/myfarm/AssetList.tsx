import { SyntheticEvent } from "react";
import { Buffalo } from "../../../interfaces/MyFarm/iBuffalo";
import { useRouter } from "next/router";

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

function MobileTable({ farmId, buffalos }: AssetListProps) {
  const { push } = useRouter();

  function handleItemClicked(e: SyntheticEvent, microchip: string) {
    e.preventDefault();
    push(`/cert/profile/myfarm/buffalo/${farmId}?microchip=${microchip}`);
  }
  return (
    <table className="w-full text-center">
      <thead className="underline bg-thuidark">
        <th className="p-2">chip</th>
        <th className="p-2">name</th>
        <th className="p-2">sex</th>
        <th className="p-2">preg</th>
      </thead>
      <tbody>
        {buffalos.length <= 0 ? (
          <div>empty</div>
        ) : (
          <>
            {buffalos.map((m) => (
              <tr
                key={m.microchip}
                className="hover:bg-thuiyellow hover:cursor-pointer odd:bg-thuidark odd:bg-opacity-80 border-[1px]"
                onClick={(e) => handleItemClicked(e, m.microchip)}
              >
                <td className="p-2">
                  {`${m.microchip.slice(0, 3)}..${m.microchip.slice(12, 15)}`}
                </td>
                <td className="p-2">{m.name}</td>
                <td className="p-2">{m.sex == "male" ? "m" : "f"}</td>
                <td className="p-2">
                  {m.pregnant == true && m.sex == "female" ? "Yes" : "-"}
                </td>
              </tr>
            ))}
          </>
        )}
      </tbody>
    </table>
  );
}
function TabletsTable({ farmId, buffalos }: AssetListProps) {
  const { push } = useRouter();

  function handleItemClicked(e: SyntheticEvent, microchip: string) {
    e.preventDefault();
    push(`/cert/profile/myfarm/buffalo/${farmId}?microchip=${microchip}`);
  }
  return (
    <table className="w-full text-center text-[20px]">
      <thead className="underline bg-thuidark border-[1px]">
        <th className="p-2">id</th>
        <th className="p-2">chip</th>
        <th className="p-2">name</th>
        <th className="p-2">sex</th>
        <th className="p-2">preg</th>
      </thead>
      <tbody>
        {buffalos.length <= 0 ? (
          <div>empty</div>
        ) : (
          <>
            {buffalos.map((m) => (
              <tr
                key={m.microchip}
                className="hover:bg-thuiyellow hover:cursor-pointer odd:bg-thuidark odd:bg-opacity-80 border-[1px]"
                onClick={(e) => handleItemClicked(e, m.microchip)}
              >
                <td className="p-2 border-[1px]">{m.id}</td>
                <td className="p-2 border-[1px]">{m.microchip}</td>
                <td className="p-2 border-[1px]">{m.name}</td>
                <td className="p-2 border-[1px]">{m.sex}</td>
                <td className="p-2 border-[1px]">
                  {m.pregnant == true && m.sex == "female" ? "Yes" : "-"}
                </td>
              </tr>
            ))}
          </>
        )}
      </tbody>
    </table>
  );
}

export default AssetList;
