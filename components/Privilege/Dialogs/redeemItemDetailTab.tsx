import React from "react";
import Image from "next/image";
import { usePrivilege } from "../../../contexts/privilegeContext";
import { trpc } from "../../../utils/trpc";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";

const RedeemItemDetailTab = () => {
  const { walletAddress } = useBitkubNext();
  const { selectedItem, redeem } = usePrivilege();

  const { data: userPoint, isLoading: loadingUserPoint } =
    trpc.user.getJaothuiPointOf.useQuery({ wallet: walletAddress! });

  return (
    <div>
      <h3 className="font-bold text-lg">_id: {selectedItem?._id}</h3>
      <div className="w-full flex flex-col items-center gap-2">
        <figure className="w-48">
          <Image
            src={selectedItem?.image ?? "/images/jaothuiHidden.jpeg"}
            width={1000}
            height={1000}
            alt="image"
          />
        </figure>
        <div>
          <div className="text-xl font-bold">{selectedItem?.name ?? "N/A"}</div>
          <p>{selectedItem?.description ?? "N/A"}</p>
        </div>
        <div>
          <div className="p-2 shadow-xl rounded-xl">
            <div className="grid grid-cols-3 place-items-center">
              <figure className="w-16">
                <Image
                  src="/images/icons/JAOTHUI-POINT.png"
                  width={1000}
                  height={1000}
                  alt="point"
                />
              </figure>
              <div>
                <div className="text-xl font-bold">JTO</div>
                <div>Jaothui Point</div>
              </div>
              <div className="font-bold">{selectedItem?.point}</div>
            </div>
          </div>
        </div>
        <div className="modal-action">
          <>
            <button
              disabled={
                loadingUserPoint ||
                userPoint.currentPoint < selectedItem?.point!
              }
              onClick={() => redeem()}
              className="btn"
            >
              Redeem
            </button>
          </>

          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn">Close</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RedeemItemDetailTab;
