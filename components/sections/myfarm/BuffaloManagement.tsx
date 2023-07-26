import { Buffalo } from "../../../interfaces/MyFarm/iBuffalo";
import { SyntheticEvent, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { trpc } from "../../../utils/trpc";
import LoadingScreen from "../../LoadingScreen";
import { useRouter } from "next/router";

interface BuffaloManagementProps {
  buffalo: Buffalo;
  update: () => void;
}

const BuffaloManagement = ({ buffalo, update }: BuffaloManagementProps) => {
  const { replace } = useRouter();
  const {
    mutate: markAsOvul,
    isLoading: ovulMarking,
    isError: ovulError,
    isSuccess: ovulated,
  } = trpc.buffalo.markOvul.useMutation();

  const {
    mutate: markAsPreg,
    isLoading: pregMarking,
    isError: pregError,
    isSuccess: pregnant,
  } = trpc.buffalo.markPreg.useMutation();

  const {
    mutate: markAsUnPreg,
    isLoading: unPregMarking,
    isError: unPregError,
    isSuccess: unpregnant,
  } = trpc.buffalo.markUnPreg.useMutation();

  const {
    mutate: markAsSold,
    isLoading: selling,
    isError: sellError,
    isSuccess: sold,
  } = trpc.buffalo.markAsSold.useMutation();

  const {
    mutate: markAsDead,
    isLoading: deadMarking,
    isError: deadError,
    isSuccess: alreadyDead,
  } = trpc.buffalo.markAsDead.useMutation();

  useEffect(() => {
    if (ovulated) toast.success(`${buffalo.id}, is ovulated!`);
    if (ovulError)
      toast.error(`${buffalo.id}, Marking as ovulation failed!, try again`);
    if (pregnant) toast.success(`${buffalo.id}, is pregnant!`);
    if (pregError)
      toast.error(`${buffalo.id}, Marking as pregnant failed!, try again`);
    if (unpregnant) toast.success(`${buffalo.id}, is set to unpregnant!`);
    if (unPregError)
      toast.error(`${buffalo.id}, Marking as unpregnant failed!, try again`);
    if (alreadyDead) {
      toast.success(`${buffalo.id}, Marked as dead!`);
      replace("/cert/profile/myfarm/list");
    }
    if (deadError)
      toast.error(`${buffalo.id}, Marking as dead failed!, try again`);
    if (sold) {
      toast.success(`${buffalo.id}, Marked as sold!`);
      replace("/cert/profile/myfarm/list");
    }
    if (sellError) toast.error(`${buffalo.id}, Selling failed!, try again`);
    update();
  }, [
    sold,
    alreadyDead,
    ovulated,
    pregnant,
    unpregnant,
    sellError,
    deadError,
    pregError,
    unPregError,
    ovulError,
  ]);

  const ovalationRef = useRef<HTMLInputElement>(null);
  const pregnantRef = useRef<HTMLInputElement>(null);

  async function handleSetOvulation(e: SyntheticEvent) {
    e.preventDefault();
    //@get latest fertilizer data

    if (ovalationRef.current?.value !== "") {
      markAsOvul({
        buffaloId: buffalo.id as number,
        timestamp: new Date(
          ovalationRef.current?.value as string
        ).toISOString(),
      });
    }
  }

  function handleSetPregnant(e: SyntheticEvent) {
    e.preventDefault();
    const fert =
      buffalo !== undefined
        ? buffalo.fertilization?.filter((f) => f.done == false)
        : [];
    if (pregnantRef.current?.value !== "") {
      markAsPreg({
        buffaloId: fert![0].id as number,
        timestamp: new Date(pregnantRef.current?.value as string).toISOString(),
      });
    }
  }

  function handleDead(e: SyntheticEvent) {
    e.preventDefault();
    markAsDead({
      buffaloId: buffalo.id as number,
    });
  }

  function handleSold(e: SyntheticEvent) {
    e.preventDefault();
    markAsSold({
      buffaloId: buffalo.id as number,
    });
  }

  function handleUnpreg(e: SyntheticEvent) {
    e.preventDefault();
    const fert =
      buffalo !== undefined
        ? buffalo.fertilization?.filter((f) => f.done == false)
        : [];
    markAsUnPreg({
      buffaloId: fert![0].id as number,
      timestamp: new Date().toISOString(),
    });
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
      {ovulMarking || pregMarking || unPregMarking || selling || deadMarking ? (
        <LoadingScreen />
      ) : null}
    </div>
  );
};

export default BuffaloManagement;
