import { SyntheticEvent } from "react";
import { useCreateFarm } from "../../../hooks/useCreateFarm";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
const CreateFarm = () => {
  const { walletAddress } = useBitkubNext();
  const { create } = useCreateFarm();

  function handleCreate(e: SyntheticEvent) {
    e.preventDefault();
    create({ wallet: walletAddress });
  }
  return (
    <div className="flex justify-center mt-10">
      <button
        className="bg-thuiwhite text-thuiyellow text-[20px] rounded-md p-3
      hover:bg-thuiyellow
      hover:text-thuiwhite"
        onClick={(e) => handleCreate(e)}
      >
        Create Your Farm
      </button>
    </div>
  );
};

export default CreateFarm;
