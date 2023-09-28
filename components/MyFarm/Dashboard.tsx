import { SyntheticEvent, useEffect } from "react";
import ModalBackdrop from "../Shared/ModalBackdrop";

import AddAsset from "./AddAsset";
import { useNewAsset } from "../../contexts/newAssetContext";
import Link from "next/link";
import { AiFillPlusCircle } from "react-icons/ai";
import { FaClipboardList } from "react-icons/fa";

const MyFarmDashboard = (data: any) => {
  const { open } = useNewAsset();
  function onNewAsset(e: SyntheticEvent) {
    e.preventDefault();
    open();
  }

  return (
    <div
      className="bg-thuidark p-3 min-w-[300px] rounded-md
    tabletS:text-[25px]
    tabletS:p-[25px] 
    "
    >
      <div
        className="grid grid-cols-3 gap-2
        tabletS:gap-3
        tabletS:pb-3
      "
      >
        <div>Total Asset</div>
        <div className="col-span-2 justify-self-end">
          {data.asset.asset.percent == "NaN" ? "0" : data.asset.asset.percent}%
        </div>
        <div>Buffalo</div>
        <div className="justify-self-center">
          {data == undefined ? "N/A" : data.asset.asset.allAsset}
        </div>
        <div className="justify-self-end">UNIT(s)</div>
      </div>
      <div className="tabletS:pb-3">
        <hr></hr>
      </div>
      <ul
        className="flex flex-col pt-3 gap-2
      tabletS:gap-4"
      >
        <li
          className="p-2 flex justify-between bg-thuigray rounded-md
        tabletS:p-3"
        >
          <div>MALE</div>
          <div>{data == undefined ? "N/A" : data.asset.asset.male} UNIT(s)</div>
        </li>
        <li
          className="p-2 flex justify-between bg-thuigray rounded-md
        tabletS:p-3"
        >
          <div>FEMALE</div>
          <div>
            {data == undefined ? "N/A" : data.asset.asset.female} UNIT(s)
          </div>
        </li>
        <li
          className="p-2 flex justify-between bg-thuigray rounded-md
          tabletS:p-3"
        >
          <div>Baby</div>
          <div>{data == undefined ? "N/A" : data.asset.asset.baby} UNIT(s)</div>
        </li>
        <li
          className="p-2 flex justify-between bg-thuigray rounded-md
        tabletS:p-3"
        >
          <div>Pregnant</div>
          <div>
            {data == undefined ? "N/A" : data.asset.asset.pregnant} UNIT(s)
          </div>
        </li>
      </ul>
      <div
        className="flex w-full justify-evenly items-center pt-3
      tabletS:pt-5"
      >
        <div className="flex flex-col gap-2">
          <div
            className="pl-3 pr-3 pt-2 pb-2 bg-thuigray text-thuiwhite rounded-md
          hover:bg-thuiyellow"
          >
            <Link
              href="/cert/profile/myfarm/list"
              className="flex gap-2 items-center"
            >
              <FaClipboardList size={25} />
              Asset List
            </Link>
          </div>
        </div>
        <button
          className="p-[20px] text-[15px] flex flex-col items-center justify-center hover:text-thuiyellow"
          onClick={(e) => onNewAsset(e)}
        >
          <AiFillPlusCircle size={70} />
          new asset
        </button>
      </div>
      <div className="text-center pt-1 pb-1 pl-2 pr-2 mt-3 bg-thuiyellow rounded-md hover:text-thuidark">
        <Link href="/cert/profile">Back</Link>
      </div>
      <ModalBackdrop>
        <div className="flex w-screen h-screen justify-center items-center">
          <AddAsset farmId={data.asset.farm.id} />
        </div>
      </ModalBackdrop>
    </div>
  );
};

export default MyFarmDashboard;
