import { useBitkubNext } from "../contexts/bitkubNextContext";
import { simplifyAddress } from "../helpers/simplifyAddress";
import { useRouter } from "next/router";

export const BitkubDisconnectButton = () => {
  const { walletAddress, disconnect } = useBitkubNext();
  const { replace } = useRouter();

  function handleDisconnect() {
    disconnect();
    replace("/");
  }

  return (
    <button
      className="bg-thuiyellow text-thuigray pl-2 pr-2 pt-1 pb-1 min-w-[100px] text-[25px] rounded-[30px] hover:text-thuiwhite
                          tabletS:text-[25px]
                          tabletS:w-[250px]"
      onClick={handleDisconnect}
    >
      Disconnect
    </button>
  );
};

export default BitkubDisconnectButton;
