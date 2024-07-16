import React from "react";
import { usePrivilege } from "../../../contexts/privilegeContext";
import { FaCheckCircle } from "react-icons/fa";
import { FaWindowClose } from "react-icons/fa";

const RedeemResultTab = () => {
  const { setStep, selectedItem, updateHistoryError, orderId } = usePrivilege();
  return (
    <div className="flex flex-col items-center gap-4 min-h-[340px] justify-center">
      {updateHistoryError ? (
        <>
          <div className="text-[#f44336] drop-shadow">
            <FaWindowClose size={100} />
          </div>
        </>
      ) : (
        <>
          <div className="text-[#4bb543] drop-shadow">
            <FaCheckCircle size={100} />
          </div>
          <div className="text-center">
            <div className="font-bold">{selectedItem?.point} JTO USED</div>
            <div>Order: {orderId}</div>
            <div>please wait for the verification system</div>
          </div>
        </>
      )}
      <form method="dialog">
        {/* if there is a button in form, it will close the modal */}
        <button onClick={() => setStep(0)} className="btn">
          Close
        </button>
      </form>
    </div>
  );
};

export default RedeemResultTab;
