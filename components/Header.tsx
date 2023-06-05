import { ConnectWalletButton } from "./ConnectWalletBtn";
import Image from "next/image";
import logo from "../public/images/thuiLogo.png";
import Link from "next/link";
import { ImMenu } from "react-icons/im";
import { FiSearch } from "react-icons/fi";
import { useMenu } from "../hooks/menuContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useBitkubNext } from "../hooks/bitkubNextContext";
import { simplifyAddress } from "../helpers/simplifyAddress";
import Head from "next/head";
import { SyntheticEvent, useRef } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Header = () => {
  const { isConnected, walletAddress } = useBitkubNext();
  const { open } = useMenu();
  const searchRef = useRef<HTMLInputElement>(null);
  const { push } = useRouter();

  function handleSearch(e: SyntheticEvent) {
    const value =
      searchRef.current?.value == undefined ? 0 : +searchRef.current.value;

    if (value <= 0) {
      return;
    }

    push(`/cert/${value}`);
  }

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
      <Head>
        <title>JaoThui Official</title>
      </Head>

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

      <div id="header-connect-wallet-btn" className="flex items-center gap-3">
        {isConnected ? <div>{simplifyAddress(walletAddress)}</div> : null}
        <button className="hover:text-thuiwhite" onClick={() => open()}>
          <ImMenu size={30} />
        </button>
        {/* <div
          className="items-center gap-2 rounded-2xl hidden p-1 bg-thuiyellow
        tabletM:flex"
        >
          <input
            className="text-thuiwhite pl-2 pr-2 pt-1 pb-1 rounded-2xl outline-none bg-thuiyellow placeholder:text-thuidark placeholder:text-opacity-80"
            type="text"
            minLength={15}
            maxLength={15}
            placeholder="microchip Id (15 digits)"
            ref={searchRef}
          ></input>
          <button
            className="hover:text-thuiwhite text-thuidark pr-1"
            onClick={(e) => handleSearch(e)}
          >
            <FiSearch size={30} />
          </button>
        </div> */}

        {/* <ConnectWalletButton /> */}
        {/* {!isConnected ? (
          <BitkubNextConnectButton />
        ) : (
          <div>{simplifyAddress(walletAddress)}</div>
        )} */}
      </div>
      <div className="absolute top-0 left-0">
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </div>
  );
};

export default Header;
