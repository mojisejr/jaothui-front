import { AiOutlineDisconnect } from "react-icons/ai";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { useRouter } from "next/router";

export const BitkubDisconnectButton = () => {
  const { disconnect, logoutError } = useBitkubNext();

  const { replace } = useRouter();

  async function handleDisconnect() {
    if (await disconnect()) replace("/");
  }

  return (
    // <button
    //   className="btn-primary font-bold hover:text-base-200 hover:bg-accent flex gap-2 px-3 py-2 rounded-xl items-center"
    //   onClick={handleDisconnect}
    // >
    <div>
    {logoutError && <p role="alert">{logoutError}</p>}
    <button
      onClick={handleDisconnect}
      className="btn-primary text-xs hover:text-base-200 hover:bg-accent flex gap-2 px-3 py-2 rounded-xl items-center border-[1px] border-thuiwhite"
    >
      <AiOutlineDisconnect size={24} />
      Disconnect
    </button>
    </div>
  );
};

export default BitkubDisconnectButton;
