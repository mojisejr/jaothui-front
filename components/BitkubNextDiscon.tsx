import { useBitkubNext } from "../hooks/bitkubNextContext";
import { simplifyAddress } from "../helpers/simplifyAddress";

export const BitkubDisconnectButton = () => {
  const { walletAddress, disconnect } = useBitkubNext();

  function handleDisconnect() {
    disconnect();
  }

  return (
    <button
      className="bg-thuiyellow text-thuigray pl-[2%] pr-[2%] pt-[1%] pb-[1%] min-w-[100px] text-[15px] rounded-[30px]
                          tabletS:text-[20px]
                          tabletS:w-[250px]"
      onClick={handleDisconnect}
    >
      {simplifyAddress(walletAddress)}
    </button>
  );
};

export default BitkubDisconnectButton;
