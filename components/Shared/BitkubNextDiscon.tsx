import { AiOutlineDisconnect } from "react-icons/ai";
import { useBitkubNext } from "../../contexts/bitkubNextContext";
import { useRouter } from "next/router";

export const BitkubDisconnectButton = () => {
  const { walletAddress, disconnect } = useBitkubNext();

  const { replace } = useRouter();

  function handleDisconnect() {
    disconnect();
    replace("/");
  }

  return (
    // <button
    //   className="btn-primary font-bold hover:text-base-200 hover:bg-accent flex gap-2 px-3 py-2 rounded-xl items-center"
    //   onClick={handleDisconnect}
    // >
    <button
      onClick={handleDisconnect}
      className="btn-primary text-xs hover:text-base-200 hover:bg-accent flex gap-2 px-3 py-2 rounded-xl items-center border-[1px] border-thuiwhite"
    >
      <AiOutlineDisconnect size={24} />
      Disconnect
    </button>
  );
};

export default BitkubDisconnectButton;
