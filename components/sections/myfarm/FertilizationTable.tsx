import { useEffect, useState } from "react";
import { Farm } from "../../../interfaces/MyFarm/iFarm";
import { Fertilization } from "../../../interfaces/MyFarm/iFertilization";
import { IoOpenOutline } from "react-icons/io5";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";

interface FertilizationProps {
  farm: Farm;
}

interface FertilizationTableData {
  id: number | undefined;
  microchip: string;
  ovulation: {
    status: boolean;
    time: string | undefined;
    relative: string;
  };
  pregnant: {
    status: boolean;
    time: string | undefined;
    relative: string;
  };
}

const FertilizationTable = ({ farm }: FertilizationProps) => {
  const [data, setData] = useState<FertilizationTableData[]>();

  function getDataToAlert() {
    const filtered = farm.buffalos.filter((b) => b.ovulation || b.pregnant);
    const mapped = filtered.map((b) => {
      const times =
        b.fertilization!.length <= 0
          ? null
          : (b.fertilization?.filter((f) => !f.end)[0] as Fertilization);

      return {
        id: b.id,
        microchip: b.microchip,
        ovulation: {
          status: b.ovulation,
          time: dayjs(times?.ovulation).format("DD/MM/YYYY"),
          relative: getRelativeTime(times?.ovulation!),
        },
        pregnant: {
          status: b.pregnant,
          time:
            times?.preg == null
              ? "N/A"
              : dayjs(times?.preg).format("DD/MM/YYYY"),
          relative: getRelativeTime(times?.preg!),
        },
      };
    });
    setData(mapped);
  }

  function getRelativeTime(inputDate: Date) {
    if (inputDate == null) return "N/A";
    dayjs.extend(relativeTime);

    const now = dayjs(new Date());
    const input = dayjs(inputDate);
    return input.from(now, true);
  }

  useEffect(() => {
    getDataToAlert();
  }, []);

  return (
    <>
      <div className="my-3">
        <div className="text-2xl">Pragnancy Scheduler</div>
        <div className="flex w-full  bg-thuidark rounded-md max-h-[30vh] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-thuiyellow">
              <tr>
                <th scope="col" className="px-2 py-3">
                  chipId
                </th>
                <th scope="col" className="px-2 py-3">
                  ovulation
                </th>
                <th scope="col" className="px-2 py-3">
                  pregnancy
                </th>
                <th scope="col" className="px-2 py-3">
                  open
                </th>
              </tr>
            </thead>
            <tbody>
              {data === undefined ? null : (
                <>
                  {data.map((d) => (
                    <tr
                      key={d.microchip}
                      className="hover:bg-thuiwhite hover:bg-opacity-30  transition-all 0.6s"
                    >
                      <td className="px-2 py-3">{d.microchip}</td>
                      <td className="px-2 py-3 leading-tight">
                        <div>{d.ovulation.time}</div>
                        <div className="text-xs">{d.ovulation.relative}</div>
                      </td>
                      <td className="px-2 py-3">
                        <div>{d.pregnant.status ? d.pregnant.time : "N/A"}</div>
                        <div className="text-xs">
                          {d.pregnant.status ? d.pregnant.relative : null}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <Link
                          href={`/cert/profile/myfarm/buffalo/${farm.id}?microchip=${d.microchip}`}
                        >
                          <IoOpenOutline size={20} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default FertilizationTable;
