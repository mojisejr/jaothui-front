import { ConnectWalletButton } from "./ConnectWalletBtn";
import Image from "next/image";
import logo from "../public/images/thuiLogo.png";
import Link from "next/link";
import { ImMenu } from "react-icons/im";
import { useAccount } from "wagmi";
import { useMenu } from "../hooks/menuContext";
import { motion } from "framer-motion";

const Header = () => {
  const { isConnected } = useAccount();
  const { open } = useMenu();
  return (
    <div
      id="header-container"
      className="relative w-full flex h-full items-center pr-[20px] pl-[20px] pt-[10px] pb-[10px] justify-between bg-thuigray text-thuiyellow
      tabletM:pr-[30px]
      tabletM:pl-[30px]
      tabletM:pt-[20px]
      tabletM:pb-[20px]
      labtop:pr-[50px]
      labtop:pl-[50px]
      "
    >
      <motion.div whileHover={{ scale: 1.08 }} transition={{ duration: 0.2 }}>
        <Link
          href="/"
          id="header-logo"
          className="text-[30px] font-bold flex items-center gap-2
        labtop:text-[50px]"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1.1, 1, 1],
              rotate: [0, 25, -25, 0, 0],
            }}
            transition={{ duration: 0.5 }}
          >
            <Image
              className="w-[50px]
        labtop:w-[100px]"
              src={logo}
              width={70}
              alt={"logo"}
            />
          </motion.div>
          JAOTHUI
        </Link>
      </motion.div>

      <div id="header-connect-wallet-btn" className="flex items-center gap-1">
        {isConnected ? (
          <button className="hover:text-thuiwhite" onClick={() => open()}>
            <ImMenu size={30} />
          </button>
        ) : null}
        <ConnectWalletButton />
      </div>
    </div>
  );
};

export default Header;
