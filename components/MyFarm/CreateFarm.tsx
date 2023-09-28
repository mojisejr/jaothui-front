import { SyntheticEvent } from "react";
import { useCreateFarm } from "../../hooks/useCreateFarm";
import { useBitkubNext } from "../../contexts/bitkubNextContext";

const CreateFarm = () => {
  const { walletAddress } = useBitkubNext();
  const { create, farmCreating } = useCreateFarm();

  function handleCreate(e: SyntheticEvent) {
    e.preventDefault();
    create({ wallet: walletAddress });
  }
  return (
    <div className="flex justify-center mt-10">
      <button
        className="bg-thuiwhite text-thuiyellow text-[20px] rounded-md p-3 
        disabled:hover:bg-thuigray
        disabled:bg-thuigray
        disabled:text-thuiwhite
        disabled:cursor-not-allowed
      hover:bg-thuiyellow
      hover:text-thuiwhite"
        disabled={farmCreating}
        onClick={(e) => handleCreate(e)}
      >
        {!farmCreating ? "Create Your Farm" : "Creating.."}
      </button>
    </div>
  );
};

export default CreateFarm;
