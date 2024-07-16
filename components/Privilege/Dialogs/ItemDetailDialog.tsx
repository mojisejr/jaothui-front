import React from "react";
import { usePrivilege } from "../../../contexts/privilegeContext";
import Image from "next/image";
import RedeemItemDetailTab from "./redeemItemDetailTab";
import RedeemCheckoutTab from "./redeemCheckoutTab";
import RedeemResultTab from "./redeemResultTab";

const ItemDetailDialog = () => {
  const { step } = usePrivilege();
  return (
    <>
      <dialog
        id="redeem_item_detail"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          {step == 0 ? <RedeemItemDetailTab /> : null}
          {step == 1 ? <RedeemCheckoutTab /> : null}
          {step == 2 ? <RedeemResultTab /> : null}
        </div>
      </dialog>
    </>
  );
};

export default ItemDetailDialog;
