import { useRouter } from "next/router";
import { SyntheticEvent } from "react";
import { Buffalo } from "../../../interfaces/MyFarm/iBuffalo";

interface AssetListProps {
  farmId: number;
  buffalos: Buffalo[];
}

const TabletsTable = ({ farmId, buffalos }: AssetListProps) => {
  const { push } = useRouter();

  function handleItemClicked(e: SyntheticEvent, microchip: string) {
    e.preventDefault();
    push(`/cert/profile/myfarm/buffalo/${farmId}?microchip=${microchip}`);
  }
  return (
    <table className="w-full text-center text-[20px] rounded-md overflow-hidden">
      <thead className="underline bg-thuiyellow">
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
                className="hover:bg-thuiwhite hover:cursor-pointer hover:bg-opacity-30  transition-all 0.6s odd:bg-thuidark odd:bg-opacity-80"
                onClick={(e) => handleItemClicked(e, m.microchip)}
              >
                <td className="px-6 py-3">{m.microchip}</td>
                <td className="px-6 py-3">{m.name}</td>
                <td className="px-6 py-3">{m.sex}</td>
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

export default TabletsTable;
