import { GiLawStar } from "react-icons/gi";
import Link from "next/link";
import { useRef } from "react";
import { useMenu } from "../hooks/menuContext";
import { simplifyAddress } from "../helpers/simplifyAddress";
import { useBitkubNext } from "../hooks/bitkubNextContext";
import BitkubNextConnectButton from "./BitkubNext";
import BitkubDisconnectButton from "./BitkubNextDiscon";

const MenuModal = () => {
  const modal = useRef<HTMLDivElement>(null);
  const { isConnected, walletAddress } = useBitkubNext();
  const { close } = useMenu();

  function handleClose() {
    if (modal.current!.classList.contains("blackdrop")) {
      modal.current!.classList.add("hidden");
      close();
    }
  }

  return (
    <div
      ref={modal}
      className="blackdrop absolute top-0 left-0 w-screen h-full bg-thuidark z-[50] bg-opacity-60"
      id="blackdrop"
    >
      <div
        className="relative w-screen h-screen flex justify-center items-center"
        id="menu-wrapper"
      >
        <div
          className="absolute top-[10%] w-[80%] max-h-[80%] bg-thuidark text-[25px] rounded-md
          tabletS:text-[30px]"
          id="menu-container"
        >
          <div className="flex justify-between">
            <div></div>
            <button
              className=" p-1 m-1 text-[30px] font-thin bg-thuiyellow rounded-tr-md"
              onClick={() => handleClose()}
            >
              x
            </button>
          </div>
          <ul className="text-thuiwhite pr-[1rem] pl-[1rem] text-center">
            <li className="p-2">MENU</li>
            <li className="border-t-[1px] border-thuiwhite border-opacity-30 pt-3 pb-3 flex justify-center">
              <MenuItem text="BUFFALO PEDIGREES" to={"/cert"} />
            </li>
            <li className="border-t-[1px] border-thuiwhite border-opacity-30 pt-3 pb-3 flex justify-center">
              {isConnected ? (
                <MenuItem text="DASHBOARD" to={"/cert/profile"} />
              ) : (
                <BitkubNextConnectButton />
              )}
            </li>
            {isConnected ? (
              <li className="border-t-[1px] border-thuiwhite border-opacity-30 pt-3 pb-3 flex justify-center ">
                <BitkubDisconnectButton />
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;

export interface MenuItemProps {
  text: string;
  to: string;
}

function MenuItem(input: MenuItemProps) {
  const { close } = useMenu();
  return (
    <Link
      onClick={() => close()}
      href={`${input.to}`}
      className="flex items-center gap-[2rem] hover:text-thuiyellow"
    >
      <GiLawStar size={30} />
      <span>{input.text}</span>
      <GiLawStar size={30} />
    </Link>
  );
}
