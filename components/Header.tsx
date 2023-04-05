import { ConnectWalletButton } from "./ConnectWalletBtn";
import Image from "next/image";
import logo from "../public/images/thuiLogo.png";

export default function Header() {
  return (
    <div
      id="header-container"
      className="w-full flex h-full items-center pr-[20px] pl-[20px] pt-[10px] pb-[10px] justify-between bg-thuigray text-thuiyellow"
    >
      <div
        id="header-logo"
        className="text-[60px] font-bold flex items-center gap-2"
      >
        <Image src={logo} width={70} alt={"logo"} />
        JAOTHUI
      </div>
      <div id="header-connect-wallet-btn">
        <ConnectWalletButton />
      </div>
    </div>
  );
}

// function ConnectWalletButton() {
//   return (
//     <div>
//       <ConnectWalletButton />
//     </div>
//     // <div className="pr-[13px] pl-[13px] pt-[5px] pb-[5px] rounded-[50px] bg-thuiyellow text-thuidark text-[40px]">
//     //   Connect Wallet
//     // </div>
//   );
// }
