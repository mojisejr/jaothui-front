import { Buffalo } from "../../../interfaces/MyFarm/iBuffalo";
import { SyntheticEvent, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface BuffaloManagementProps {
  buffalo: Buffalo;
  update: () => void;
}

const BuffaloManagement = ({ buffalo, update }: BuffaloManagementProps) => {
  const ovalationRef = useRef<HTMLInputElement>(null);
  const pregnantRef = useRef<HTMLInputElement>(null);
  console.log(buffalo);

  async function handleSetOvulation(e: SyntheticEvent) {
    e.preventDefault();
    //@get latest fertilizer data

    if (ovalationRef.current?.value !== "") {
      axios
        .post(
          `/api/buffalo/fertilizer/${buffalo.id}?ovulation=${new Date(
            ovalationRef.current?.value as string
          ).toISOString()}`
        )
        .then(() => {
          toast.success("Update Ovulation Successful!");
          update();
        })
        .catch(() => toast.error("Updata Ovulation Failed!"));
    }
  }

  function handleSetPregnant(e: SyntheticEvent) {
    e.preventDefault();
    const fert =
      buffalo !== undefined
        ? buffalo.fertilization?.filter((f) => f.done == false)
        : [];
    if (pregnantRef.current?.value !== "") {
      axios
        .put(
          `/api/buffalo/fertilizer/${fert![0].id}/preg?preg=${new Date(
            pregnantRef.current?.value as string
          ).toISOString()}`
        )
        .then(() => {
          toast.success("Update Pregnancy Successful!");
          update();
        })
        .catch(() => toast.error("Update Pregnancy Failed!"));
    }
  }

  function handleDead(e: SyntheticEvent) {
    e.preventDefault();
    axios
      .put(`/api/buffalo/manage/${buffalo.id}/dead`)
      .then(() => {
        toast.success("Mark as dead Successful!");
        update();
      })
      .catch(() => toast.error("Mark as dead Failed!"));
  }

  function handleSold(e: SyntheticEvent) {
    e.preventDefault();
    axios
      .put(`/api/buffalo/manage/${buffalo.id}/sold`)
      .then(() => {
        toast.success("Mark as sold Successful!");
        update();
      })
      .catch(() => toast.error("Mark as sold Failed!"));
  }

  function handleUnpreg(e: SyntheticEvent) {
    e.preventDefault();
    const fert =
      buffalo !== undefined
        ? buffalo.fertilization?.filter((f) => f.done == false)
        : [];
    axios
      .put(
        `/api/buffalo/fertilizer/${
          fert![0].id
        }/unpreg?end=${new Date().toISOString()}`
      )
      .then(() => {
        toast.success("Update Unpregnancy Successful!");
        update();
      })
      .catch(() => toast.error("Update Unpregnancy Failed!"));
  }

  return (
    <div
      className="border-[2px]  p-2 min-w-[300px] bg-thuiwhite
      rounded-md
    shadow-[0px_13px_27px_-5px_rgba(0,0,0,0.60)]"
    >
      <div className="underline">Manangement</div>
      <div className="flex flex-col gap-2">
        {buffalo.sex == "female" && buffalo.pregnant == false ? (
          <div className="border-[1px] rounded-md p-2 flex flex-col gap-2">
            {!buffalo.ovulation ? (
              <div className="flex gap-2 items-center justify-between">
                <div className="text-[20px]">Ovalation:</div>
                <input
                  className="text-thuiyellow p-2 rounded-md"
                  type="date"
                  required
                  ref={ovalationRef}
                ></input>
                <button
                  className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
            hover:bg-thuiyellow"
                  onClick={(e) => handleSetOvulation(e)}
                >
                  Save
                </button>
              </div>
            ) : null}
            {buffalo.ovulation && !buffalo.pregnant ? (
              <div className="flex gap-2 items-center justify-between">
                <div className="text-[20px]">Pregnant: </div>
                <input
                  className="text-thuiyellow p-2 rounded-md"
                  type="date"
                  required
                  ref={pregnantRef}
                ></input>
                <button
                  className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md 
                  hover:bg-thuiyellow
                  "
                  onClick={(e) => handleSetPregnant(e)}
                >
                  Save
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
            hover:bg-thuiyellow"
            onClick={(e) => handleDead(e)}
          >
            Die
          </button>
          <button
            className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
            hover:bg-thuiyellow"
            onClick={(e) => handleSold(e)}
          >
            Sold
          </button>
          {buffalo.pregnant ? (
            <button
              className="flex items-center gap-2 text-thuiwhite p-2 bg-thuidark rounded-md
            hover:bg-thuiyellow"
              onClick={(e) => handleUnpreg(e)}
            >
              Unpreg
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BuffaloManagement;
