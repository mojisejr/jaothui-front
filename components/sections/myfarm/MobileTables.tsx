import { useRouter } from "next/router";
import { SyntheticEvent } from "react";
import { Buffalo } from "../../../interfaces/MyFarm/iBuffalo";

interface AssetListProps {
  farmId: number;
  buffalos: Buffalo[];
}

const MobileTable = ({ farmId, buffalos }: AssetListProps) => {
  const { push } = useRouter();

  function handleItemClicked(e: SyntheticEvent, microchip: string) {
    e.preventDefault();
    push(`/cert/profile/myfarm/buffalo/${farmId}?microchip=${microchip}`);
  }
  return (
    <table className="w-full text-center  rounded-md overflow-hidden">
      <thead className="bg-thuiyellow">
        <th scope="col" className="px-6 py-3">
          chip
        </th>
        <th scope="col" className="px-6 py-3">
          name
        </th>
        <th scope="col" className="px-6 py-3">
          sex
        </th>
        <th scope="col" className="px-6 py-3">
          preg
        </th>
      </thead>
      <tbody>
        {buffalos.length <= 0 ? (
          <div>empty</div>
        ) : (
          <>
            {buffalos.map((m) => (
              <tr
                key={m.microchip}
                className="hover:bg-thuiyellow hover:cursor-pointer odd:bg-thuidark odd:bg-opacity-80"
                onClick={(e) => handleItemClicked(e, m.microchip)}
              >
                <td className="px-6 py-3">
                  {`${m.microchip.slice(0, 3)}..${m.microchip.slice(12, 15)}`}
                </td>
                <td className="px-6 py-3">{m.name}</td>
                <td className="px-6 py-3">{m.sex == "male" ? "m" : "f"}</td>
                <td className="px-6 py-3">
                  {m.pregnant == true && m.sex == "female" ? "Yes" : "-"}
                </td>
              </tr>
            ))}
          </>
        )}
      </tbody>
    </table>
  );
};

export default MobileTable;
