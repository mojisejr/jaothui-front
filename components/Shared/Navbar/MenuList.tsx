import { useRouter } from "next/router";
import { useBitkubNext } from "../../../contexts/bitkubNextContext";
import BitkubNextConnectButton from "../BitkubNext";
import BitkubDisconnectButton from "../BitkubNextDiscon";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AiFillCaretRight } from "react-icons/ai";
import ConnectedList from "./ConnectionList";

const linkHoverVariant = {
  initial: { x: 0 },
  transition: {
    duration: 0.2,
    type: "tween",
    ease: "easeInOut",
  },
  whileHover: {
    x: 3,
  },
};

const MenuList = () => {
  const { isConnected } = useBitkubNext();
  const { pathname } = useRouter();
  return (
    <div className="drawer-side z-[10]">
      <label htmlFor="my-drawer-3" className="drawer-overlay"></label>
      <ul className="menu p-4 w-52 min-h-full bg-neutral text-thuiwhite rounded-tr-3xl shadow-2xl">
        <li>
          <Link href="/" className="flex">
            <Image
              className="w-[30px]"
              src="/images/thuiLogo.png"
              width={30}
              height={30}
              alt="jaothui-logo"
            />
            <div className="font-bold text-lg">JAOTHUI</div>
          </Link>
        </li>
        <hr />
        <motion.li
          variants={linkHoverVariant}
          initial="initial"
          whileHover="whileHover"
        >
          <Link
            href="/whitepaper.pdf"
            target="_blank"
            className={`hover:text-primary`}
          >
            <AiFillCaretRight size={24} />
            <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
              Whitepaper
            </motion.div>
          </Link>
        </motion.li>
        <motion.li
          variants={linkHoverVariant}
          initial="initial"
          whileHover="whileHover"
        >
          <Link
            href="https://www.bitkubnft.com/store/0xef22447b5b06677c9597df18d5f2398c82a062a0?type=home"
            target="_blank"
            className={`hover:text-primary`}
          >
            <AiFillCaretRight size={24} />
            <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
              NFT Profile
            </motion.div>
          </Link>
        </motion.li>
        <motion.li
          variants={linkHoverVariant}
          initial="initial"
          whileHover="whileHover"
        >
          <Link
            href="/cert"
            className={`${
              pathname == "/cert"
                ? "bg-primary hover:bg-primary"
                : "hover:text-primary "
            }`}
          >
            <AiFillCaretRight size={24} />
            <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
              Pedigree List
            </motion.div>
          </Link>
        </motion.li>
        <motion.li
          variants={linkHoverVariant}
          initial="initial"
          whileHover="whileHover"
        >
          <Link
            href="/partners"
            className={`${
              pathname == "/partners"
                ? "bg-primary hover:bg-primary"
                : "hover:text-primary "
            }`}
          >
            <AiFillCaretRight size={24} />
            <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
              Partners
            </motion.div>
          </Link>
        </motion.li>
        <motion.li
          variants={linkHoverVariant}
          initial="initial"
          whileHover="whileHover"
        >
          <Link
            href="https://kwaithai.com"
            target="_blank"
            className="hover:text-primary"
          >
            <AiFillCaretRight size={24} />
            <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
              Kwaithai.com
            </motion.div>
          </Link>
        </motion.li>
        {isConnected ? (
          <>
            <div className="text-center border-b-[1px] border-white py-2">
              Your Menu
            </div>
            <ConnectedList />
          </>
        ) : null}
        <li>
          {/* <LoginWithLineButton /> */}
          {isConnected ? (
            <BitkubDisconnectButton />
          ) : (
            <BitkubNextConnectButton />
          )}
        </li>
      </ul>
    </div>
  );
};

export default MenuList;
